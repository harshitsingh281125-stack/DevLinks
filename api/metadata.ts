import { handleMetadataRequest } from "../src/server/metadata";

type RequestLike = {
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
};

type ResponseLike = {
  json: (body: unknown) => void;
  setHeader?: (name: string, value: string) => void;
  status: (code: number) => ResponseLike;
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  await handleMetadataRequest(req, res);
}
