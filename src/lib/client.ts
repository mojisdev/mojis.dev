import createClient from "openapi-fetch";
import type { paths } from "../api-definitions"
import { API_URL  } from "astro:env/client"

export const client = createClient<paths>({ baseUrl: API_URL });
