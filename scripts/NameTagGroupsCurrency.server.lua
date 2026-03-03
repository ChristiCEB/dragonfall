--[[
  NameTag + Groups + Currency (Drogons) — Dragonfall backend
  ==========================================================
  Backend: https://dragonfall-smoky.vercel.app

  Endpoints used:
  A) Groups (nametag options, managed by website admin):
     GET https://dragonfall-smoky.vercel.app/postbacks/groups/fetch
     Returns: [ { groupName, groupId, groupColor, minRank? }, ... ]

  B) Balance (per-player Drogons, single source of truth):
     GET https://dragonfall-smoky.vercel.app/postbacks/balance/fetch?key=ROBLOX_PRIVATE_KEY&roblox_userid=USERID
     Returns: { roblox_userid: number, balance: number }

  Configuration:
  - Set _G.privateKey to your ROBLOX_PRIVATE_KEY (server-only, never expose to client).
  - Run in ServerScriptService or similar; uses HttpService (must be enabled in Game Settings).
]]

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local BASE = "https://dragonfall-smoky.vercel.app"
local BALANCE_REFRESH_INTERVAL = 30

-- Global state: balance cache and nametag groups (populated from backend)
if _G.balance == nil then _G.balance = {} end
if _G.groups == nil then _G.groups = {} end
if _G.privateKey == nil then _G.privateKey = "" end

-- Fallback groups only if backend fetch fails (do not overwrite when fetch succeeds)
local FALLBACK_GROUPS = {
  { groupName = "TARGARYEN REALM", groupId = 10638225, groupColor = "170,32,32", minRank = 0 };
}

-- Special tags that are not from backend (hardcoded display names)
local SPECIAL_TAG_NAMES = {
  ["KNIGHTS OF THE DRAGON"] = true;
  ["MODERATION"] = true;
}

-- ---------------------------------------------------------------------------
-- HTTP: Balance fetch (per-player)
-- ---------------------------------------------------------------------------
local function fetchBalanceForPlayer(player)
  local key = _G.privateKey
  if not key or key == "" then
    warn("[Drogons] ROBLOX_PRIVATE_KEY not set (_G.privateKey). Balance fetch skipped.")
    return nil
  end
  local userId = player.UserId
  local url = string.format("%s/postbacks/balance/fetch?key=%s&roblox_userid=%d",
    BASE, HttpService:UrlEncode(key), userId)
  local ok, result = pcall(function()
    return HttpService:RequestAsync({
      Url = url;
      Method = "GET";
      Headers = { ["Content-Type"] = "application/json" };
    })
  end)
  if not ok then
    warn("[Drogons] Balance fetch error for UserId", userId, ":", result)
    return nil
  end
  if result.StatusCode ~= 200 then
    warn("[Drogons] Balance fetch failed. StatusCode:", result.StatusCode, "Body:", result.Body or "")
    return nil
  end
  local data = nil
  pcall(function()
    data = HttpService:JSONDecode(result.Body)
  end)
  if type(data) == "table" and type(data.balance) == "number" then
    return data.balance
  end
  warn("[Drogons] Balance response invalid for UserId", userId, "Body:", result.Body or "")
  return nil
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
  local attr = player:GetAttribute("Drogons")
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

-- Trigger an immediate balance fetch and update cache + attribute + nametag. Call after spend/loot.
function _G.RefreshDrogons(player)
  if not player or not player.Parent then return end
  local balance = fetchBalanceForPlayer(player)
  if balance ~= nil then
    _G.balance[player.UserId] = balance
    player:SetAttribute("Drogons", balance)
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

-- ---------------------------------------------------------------------------
-- Player lifecycle: fetch balance, set attribute, hook changes, refresh nametag
-- ---------------------------------------------------------------------------
local function onPlayerAdded(player)
  -- Initial balance fetch
  local balance = fetchBalanceForPlayer(player)
  if balance ~= nil then
    _G.balance[player.UserId] = balance
    player:SetAttribute("Drogons", balance)
  else
    _G.balance[player.UserId] = 0
    player:SetAttribute("Drogons", 0)
  end

  -- When Drogons attribute changes (e.g. after RefreshDrogons), update nametag
  player:GetAttributeChangedSignal("Drogons"):Connect(function()
    _G.updateNameTag(player)
  end)

  -- Periodic balance refresh per player
  task.spawn(function()
    while player.Parent do
      task.wait(BALANCE_REFRESH_INTERVAL)
      if not player.Parent then break end
      local b = fetchBalanceForPlayer(player)
      if b ~= nil then
        _G.balance[player.UserId] = b
        player:SetAttribute("Drogons", b)
      end
    end
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
