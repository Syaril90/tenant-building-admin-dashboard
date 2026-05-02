export async function mockApiResponse<T>(data: T, delay = 900): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return data;
}
