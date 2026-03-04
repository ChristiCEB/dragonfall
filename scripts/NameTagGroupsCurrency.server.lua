--[[
  NameTag + Groups + Currency (Drogons) — Dragonfall backend
  ==========================================================
  Backend: https://dragonfall-smoky.vercel.app

  Endpoints used:
  A) Groups (nametag options, managed by website admin):
     GET https://dragonfall-smoky.vercel.app/postbacks/groups/fetch
     Returns: [ { groupName, groupId, groupColor, minRank? }, ... ]

  B) Balance (bulk list, no key required):
     GET https://dragonfall-smoky.vercel.app/postbacks/drogons/fetch
     Returns: [ { roblox_userid: number, balance: number }, ... ]

  In-game: Balance is stored in _G.balance[userId] and player:GetAttribute("drogons").
  Group name and activity points are provided by the game (e.g. via activity postback); this script does not preset them.
]]

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local BASE = "https://dragonfall-smoky.vercel.app"
local BALANCE_REFRESH_INTERVAL = 30

-- Global state: balance cache (userId -> balance) and nametag groups (populated from backend)
if _G.balance == nil then _G.balance = {} end
if _G.groups == nil then _G.groups = {} end

-- Fallback groups only if backend fetch fails (do not overwrite when fetch succeeds)
local FALLBACK_GROUPS = {
  { groupName = "DRAGONFALL", groupId = 9667152, groupColor = "170,32,32", minRank = 0 };
}

-- Special tags that are not from backend (hardcoded display names)
local SPECIAL_TAG_NAMES = {
  ["KNIGHTS OF THE DRAGON"] = true;
  ["MODERATION"] = true;
}

-- ---------------------------------------------------------------------------
-- HTTP: Balance fetch (bulk list from /postbacks/drogons/fetch, no key)
-- ---------------------------------------------------------------------------
local function fetchAllBalances()
  local url = BASE .. "/postbacks/drogons/fetch"
  local ok, result = pcall(function()
    return HttpService:RequestAsync({
      Url = url;
      Method = "GET";
      Headers = { ["Content-Type"] = "application/json" };
    })
  end)
  if not ok then
    warn("[Drogons] Balance fetch error:", result)
    return false
  end
  if result.StatusCode ~= 200 then
    warn("[Drogons] Balance fetch failed. StatusCode:", result.StatusCode, "Body:", result.Body or "")
    return false
  end
  local list = nil
  pcall(function()
    list = HttpService:JSONDecode(result.Body)
  end)
  if type(list) ~= "table" then
    warn("[Drogons] Balance response invalid. Body:", result.Body or "")
    return false
  end
  for _, entry in ipairs(list) do
    local uid = entry.roblox_userid
    local bal = entry.balance
    if type(uid) == "number" and type(bal) == "number" then
      _G.balance[uid] = bal
    end
  end
  return true
end

-- ---------------------------------------------------------------------------
-- HTTP: Groups fetch (nametag options from admin)
-- ---------------------------------------------------------------------------
local function fetchGroupsFromBackend()
  local url = BASE .. "/postbacks/groups/fetch"
  local ok, result = pcall(function()
    return HttpService:RequestAsync({
      Url = url;
      Method = "GET";
      Headers = { ["Content-Type"] = "application/json" };
    })
  end)
  if not ok then
    warn("[Groups] Fetch error:", result)
    return false
  end
  if result.StatusCode ~= 200 then
    warn("[Groups] Fetch failed. StatusCode:", result.StatusCode, "Body:", result.Body or "")
    return false
  end
  local list = nil
  pcall(function()
    list = HttpService:JSONDecode(result.Body)
  end)
  if type(list) == "table" and #list > 0 then
    _G.groups = list
    return true
  end
  if type(list) == "table" then
    _G.groups = list
    return true
  end
  return false
end

-- ---------------------------------------------------------------------------
-- Nametag: build tag text and update UI
-- ---------------------------------------------------------------------------
local function getDrogonsForPlayer(player)
  local attr = player:GetAttribute("drogons")
  if attr ~= nil then
    local n = tonumber(attr)
    if n ~= nil then return n end
  end
  return _G.balance[player.UserId] or 0
end

-- Updates the existing nametag UI for a player (if present). Call when balance or group changes.
function _G.updateNameTag(player)
  if not player or not player.Parent then return end
  local tag = player:FindFirstChild("NameTag") or (player.Character and player.Character:FindFirstChild("NameTag"))
  if not tag then return end
  local drogonsLabel = tag:FindFirstChild("Drogons")
  if drogonsLabel and drogonsLabel:IsA("TextLabel") then
    local amount = getDrogonsForPlayer(player)
    drogonsLabel.Text = tostring(amount) .. " Drogons"
  end
end

-- Full nametag build (group line + currency line). Used when creating or refreshing tag.
local function changeNameTag(player, groupName, groupColorRgb)
  if not player or not player.Parent then return end
  local tag = player:FindFirstChild("NameTag") or (player.Character and player.Character:FindFirstChild("NameTag"))
  if not tag then return end
  if groupName and groupName ~= "" then
    local line = tag:FindFirstChild("GroupLine") or tag:FindFirstChild("Group")
    if line and line:IsA("TextLabel") then
      line.Text = groupName
      if groupColorRgb then
        local r, g, b = groupColorRgb:match("^(%d+),(%d+),(%d+)$")
        if r and g and b then
          line.TextColor3 = Color3.fromRGB(tonumber(r), tonumber(g), tonumber(b))
        end
      end
    end
  end
  local drogonsLabel = tag:FindFirstChild("Drogons")
  if drogonsLabel and drogonsLabel:IsA("TextLabel") then
    drogonsLabel.Text = tostring(getDrogonsForPlayer(player)) .. " Drogons"
  end
end

-- Trigger an immediate balance refresh (refetch bulk and update this player). Call after spend/loot.
function _G.RefreshDrogons(player)
  if not player or not player.Parent then return end
  if fetchAllBalances() then
    local balance = _G.balance[player.UserId] or 0
    player:SetAttribute("drogons", balance)
    _G.updateNameTag(player)
  end
end

-- ---------------------------------------------------------------------------
-- Group resolution: get player's best group from _G.groups (by rank in group)
-- ---------------------------------------------------------------------------
local function getPlayerGroupInfo(player)
  local groups = _G.groups
  if type(groups) ~= "table" or #groups == 0 then return nil, nil end
  local userId = player.UserId
  local bestName, bestColor, bestRank = nil, nil, -1
  for _, g in ipairs(groups) do
    local groupId = tonumber(g.groupId)
    if groupId then
      local minRank = tonumber(g.minRank) or 0
      local ok, rank = pcall(function()
        return game:GetService("GroupService"):GetGroupRankAsync(userId, groupId)
      end)
      if ok and type(rank) == "number" and rank >= minRank and rank > bestRank then
        bestRank = rank
        bestName = tostring(g.groupName or "")
        bestColor = tostring(g.groupColor or "255,255,255")
      end
    end
  end
  return bestName, bestColor
end

-- Apply current _G.balance to a player's attribute and nametag (call after bulk fetch or when player joins).
local function applyBalanceToPlayer(player)
  if not player.Parent then return end
  local balance = _G.balance[player.UserId] or 0
  player:SetAttribute("drogons", balance)
  _G.updateNameTag(player)
end

-- ---------------------------------------------------------------------------
-- Player lifecycle: use bulk balance; hook attribute change; refresh nametag
-- ---------------------------------------------------------------------------
local function onPlayerAdded(player)
  -- Set attribute from cache (bulk fetch may have run already; if not, we refresh once)
  applyBalanceToPlayer(player)

  -- When drogons attribute changes (e.g. after RefreshDrogons or bulk refresh), update nametag
  player:GetAttributeChangedSignal("drogons"):Connect(function()
    _G.updateNameTag(player)
  end)
end

local function applyNameTagToCharacter(player, character)
  if not character then return end
  local humanoid = character:WaitForChild("HumanoidRootPart", 5)
  if not humanoid then return end
  local groupName, groupColor = getPlayerGroupInfo(player)
  if not groupName and #_G.groups == 0 then
    groupName = FALLBACK_GROUPS[1] and FALLBACK_GROUPS[1].groupName or nil
    groupColor = FALLBACK_GROUPS[1] and FALLBACK_GROUPS[1].groupColor or nil
  end
  changeNameTag(player, groupName, groupColor)
end

-- When character appears, build/refresh nametag (group + Drogons line)
local function onCharacterAdded(player, character)
  character:WaitForChild("HumanoidRootPart", 10)
  applyNameTagToCharacter(player, character)
end

-- ---------------------------------------------------------------------------
-- NameBridge: remote invoke from client for nametag updates (if your game uses it)
-- ---------------------------------------------------------------------------
local function bindNameBridge()
  local bridge = script.Parent:FindFirstChild("NameBridge") or game:GetService("ReplicatedStorage"):FindFirstChild("NameBridge")
  if bridge and bridge:IsA("RemoteFunction") then
    bridge.OnServerInvoke = function(player)
      applyNameTagToCharacter(player, player.Character)
      return true
    end
  elseif bridge and bridge:IsA("RemoteEvent") then
    bridge.OnServerEvent:Connect(function(player)
      applyNameTagToCharacter(player, player.Character)
    end)
  end
end

-- ---------------------------------------------------------------------------
-- Init: fetch groups from backend (do not overwrite with hardcoded; use fallback only on failure)
-- ---------------------------------------------------------------------------
task.spawn(function()
  local success = fetchGroupsFromBackend()
  if not success then
    _G.groups = FALLBACK_GROUPS
    warn("[Groups] Using fallback groups (backend fetch failed).")
  end
end)

-- ---------------------------------------------------------------------------
-- Balance: fetch bulk from /postbacks/drogons/fetch periodically; apply to all players
-- (Group name and activity points come from the game; we only manage balance display here.)
-- ---------------------------------------------------------------------------
local function refreshAllBalancesAndApply()
  if fetchAllBalances() then
    for _, p in ipairs(Players:GetPlayers()) do
      applyBalanceToPlayer(p)
    end
  end
end

task.spawn(function()
  refreshAllBalancesAndApply()
  while true do
    task.wait(BALANCE_REFRESH_INTERVAL)
    refreshAllBalancesAndApply()
  end
end)

-- Existing players
for _, p in ipairs(Players:GetPlayers()) do
  task.spawn(function() onPlayerAdded(p) end)
  if p.Character then
    task.spawn(function() onCharacterAdded(p, p.Character) end)
  end
  p.CharacterAdded:Connect(function(char)
    onCharacterAdded(p, char)
  end)
end

Players.PlayerAdded:Connect(function(player)
  onPlayerAdded(player)
  player.CharacterAdded:Connect(function(character)
    onCharacterAdded(player, character)
  end)
end)

-- NameBridge (optional)
task.defer(bindNameBridge)
