import { readFile, writeFile } from "fs/promises";
import path from "path";

type StoredOAuthState = {
  state: string;
  createdAt: number;
};

const stateStorePath = path.join(process.cwd(), ".google-oauth-state.json");
const maxStateAgeMs = 10 * 60 * 1000;

async function readStates() {
  try {
    const stateJson = await readFile(stateStorePath, "utf8");
    const states = JSON.parse(stateJson) as StoredOAuthState[];
    const now = Date.now();

    return states.filter((state) => now - state.createdAt < maxStateAgeMs);
  } catch {
    return [];
  }
}

async function writeStates(states: StoredOAuthState[]) {
  await writeFile(stateStorePath, JSON.stringify(states, null, 2), "utf8");
}

export async function saveGoogleOAuthState(state: string) {
  const states = await readStates();
  await writeStates([...states, { state, createdAt: Date.now() }]);
}

export async function consumeGoogleOAuthState(state: string) {
  const states = await readStates();
  const stateExists = states.some((storedState) => storedState.state === state);

  if (stateExists) {
    await writeStates(
      states.filter((storedState) => storedState.state !== state),
    );
  }

  return stateExists;
}
