export const mediaDriveUrl =
  "https://icedrive.net/s/Z4F8bBxaRiFNPZCiz7DXDQPby8Vx";

export async function getDriveAssets() {
  return {
    source: "icedrive",
    url: mediaDriveUrl,
    assets: [],
  };
}
