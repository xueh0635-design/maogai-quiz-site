(function () {
  const config = window.MAOGAI_SYNC_CONFIG || {};
  const LOCAL_MODULE = "./neon-serverless.mjs";

  let neonLoaderPromise = null;
  let sqlFactory = null;

  function randomCode(length = 8) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  async function loadNeonFactory() {
    if (sqlFactory) return sqlFactory;
    if (!config.enabled || !config.databaseUrl) {
      throw new Error("同步配置未启用");
    }
    if (!neonLoaderPromise) {
      neonLoaderPromise = (async () => {
        const mod = await import(LOCAL_MODULE);
        const neon = mod.neon || mod.default?.neon || mod.default;
        if (typeof neon === "function") return neon;
        throw new Error("无法加载 Neon Serverless Driver");
      })();
    }
    sqlFactory = await neonLoaderPromise;
    return sqlFactory;
  }

  async function getSql() {
    const neon = await loadNeonFactory();
    return neon(config.databaseUrl);
  }

  async function fetchGroup(joinCode) {
    const sql = await getSql();
    const rows = await sql`
      SELECT join_code, state, revision, updated_at, last_device_id, last_device_name
      FROM sync_groups
      WHERE join_code = ${joinCode}
      LIMIT 1
    `;
    return rows[0] || null;
  }

  async function createGroup(joinCode, initialState, deviceInfo) {
    const sql = await getSql();
    const createdAt = nowIso();
    await sql`
      INSERT INTO sync_groups (
        join_code,
        state,
        revision,
        created_at,
        updated_at,
        last_device_id,
        last_device_name
      ) VALUES (
        ${joinCode},
        ${JSON.stringify(initialState)}::jsonb,
        0,
        ${createdAt},
        ${createdAt},
        ${deviceInfo.deviceId || null},
        ${deviceInfo.deviceName || null}
      )
      ON CONFLICT (join_code) DO NOTHING
    `;
    return await fetchGroup(joinCode);
  }

  async function updateGroup(joinCode, expectedRevision, nextState, deviceInfo) {
    const sql = await getSql();
    const rows = await sql`
      UPDATE sync_groups
      SET
        state = ${JSON.stringify(nextState)}::jsonb,
        revision = revision + 1,
        updated_at = ${nowIso()},
        last_device_id = ${deviceInfo.deviceId || null},
        last_device_name = ${deviceInfo.deviceName || null}
      WHERE join_code = ${joinCode}
        AND revision = ${expectedRevision}
      RETURNING join_code, state, revision, updated_at, last_device_id, last_device_name
    `;
    return rows[0] || null;
  }

  window.MaogaiSyncClient = {
    randomCode,
    deepClone,
    fetchGroup,
    createGroup,
    updateGroup,
    nowIso,
  };
})();
