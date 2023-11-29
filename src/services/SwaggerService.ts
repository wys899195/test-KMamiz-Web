import Config from "../../Config";
import { TTaggedSwagger } from "../entities/TTaggedSwagger";

export default class SwaggerService {
  private static instance?: SwaggerService;
  static getInstance = () => this.instance || (this.instance = new this());
  private constructor() {}

  private readonly prefix = `${Config.ApiHost}${Config.ApiPrefix}`;

  private async get<T>(path: string) {
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json()) as T;
  }

  async getTags(uniqueServiceName: string) {
    return (
      (await this.get<string[]>(
        `${this.prefix}/swagger/tags/${encodeURIComponent(uniqueServiceName)}`
      )) || []
    );
  }

  async addTaggedSwagger(tagged: TTaggedSwagger) {
    const res = await fetch(`${this.prefix}/swagger/tags`, {
      method: "POST",
      body: JSON.stringify(tagged),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.ok;
  }

  async deleteTaggedSwagger(uniqueServiceName: string, tag: string) {
    const res = await fetch(`${this.prefix}/swagger/tags`, {
      method: "DELETE",
      body: JSON.stringify({ uniqueServiceName, tag }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.ok;
  }
}
