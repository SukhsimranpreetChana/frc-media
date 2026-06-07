export const mediaDriveUrl =
  "https://icedrive.net/s/Z4F8bBxaRiFNPZCiz7DXDQPby8Vx";

export const mediaUploadUrl =
  "https://icedrive.net/r/334H4zGgVrz8D61x81Ch6XzDhkfdHfcR7fZrDcC8";

export function getTeamArchiveFolderName(teamNumber: string) {
  return `FRC ${teamNumber}`;
}

export async function getDriveAssets() {
  return {
    source: "icedrive",
    url: mediaDriveUrl,
    assets: [],
  };
}
