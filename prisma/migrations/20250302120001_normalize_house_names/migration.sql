-- Normalize existing House names: strip "House " prefix (case-insensitive).
-- Only update when stripped name does not already exist (avoid unique violation).
UPDATE "House" h1
SET name = TRIM(REGEXP_REPLACE(h1.name, '^[Hh]ouse\s+', ''))
WHERE h1.name ~ '^[Hh]ouse\s+'
  AND TRIM(REGEXP_REPLACE(h1.name, '^[Hh]ouse\s+', '')) != ''
  AND NOT EXISTS (
    SELECT 1 FROM "House" h2
    WHERE h2.id != h1.id
      AND h2.name = TRIM(REGEXP_REPLACE(h1.name, '^[Hh]ouse\s+', ''))
  );
