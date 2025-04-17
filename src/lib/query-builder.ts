import { client } from "./client";
import type { paths } from "../api-definitions";

type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=';
type LogicalOperator = 'AND' | 'OR';

type WhereClause = {
  field: string;
  operator: Operator;
  value: any;
  logic?: LogicalOperator;
};

type NestedWhereGroup = {
  clauses: Array<WhereClause | NestedWhereGroup>;
  logic: LogicalOperator;
};

type OrderDirection = 'ASC' | 'DESC';

type OrderClause = {
  field: string;
  direction: OrderDirection;
};

// Types for Astro static paths
export type StaticPathItem<T = any> = {
  params: Record<string, string>;
  props?: T;
};

/**
 * Query builder for collections (versions, categories, etc.)
 */
export class QueryBuilder<T = any> {
  private collectionName: string;
  private whereClauses: Array<WhereClause | NestedWhereGroup> = [];
  private orderClauses: OrderClause[] = [];
  private selectedFields: string[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private cached: boolean = true;
  private path: string;
  private params: Record<string, any> = {};

  constructor(collectionName: string, path?: string, params: Record<string, any> = {}) {
    this.collectionName = collectionName;
    this.path = path || this.getDefaultPath();
    this.params = params;
  }

  private getDefaultPath(): string {
    // Map collection names to API paths
    switch (this.collectionName) {
      case 'versions':
        return '/api/v1/versions';
      case 'categories':
        return '/api/v1/categories/{version}';
      // Add more mappings as needed
      default:
        return `/api/v1/${this.collectionName}`;
    }
  }

  /**
   * Add a where clause to the query
   */
  where(field: string | ((query: QueryBuilder<T>) => QueryBuilder<T>), operator?: Operator | any, value?: any): QueryBuilder<T> {
    // Handle nested query
    if (typeof field === 'function') {
      const nestedQuery = new QueryBuilder<T>(this.collectionName);
      field(nestedQuery);

      this.whereClauses.push({
        clauses: nestedQuery.whereClauses as any,
        logic: 'AND',
      });

      return this;
    }

    // Handle direct field query
    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }

    this.whereClauses.push({
      field,
      operator: operator as Operator,
      value,
    });

    return this;
  }

  /**
   * Add an AND where clause
   */
  andWhere(field: string | ((query: QueryBuilder<T>) => QueryBuilder<T>), operator?: Operator | any, value?: any): QueryBuilder<T> {
    if (typeof field === 'function') {
      const nestedQuery = new QueryBuilder<T>(this.collectionName);
      field(nestedQuery);

      this.whereClauses.push({
        clauses: nestedQuery.whereClauses as any,
        logic: 'AND',
      });

      return this;
    }

    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }

    this.whereClauses.push({
      field,
      operator: operator as Operator,
      value,
      logic: 'AND',
    });

    return this;
  }

  /**
   * Add an OR where clause
   */
  orWhere(field: string | ((query: QueryBuilder<T>) => QueryBuilder<T>), operator?: Operator | any, value?: any): QueryBuilder<T> {
    if (typeof field === 'function') {
      const nestedQuery = new QueryBuilder<T>(this.collectionName);
      field(nestedQuery);

      this.whereClauses.push({
        clauses: nestedQuery.whereClauses as any,
        logic: 'OR',
      });

      return this;
    }

    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }

    this.whereClauses.push({
      field,
      operator: operator as Operator,
      value,
      logic: 'OR',
    });

    return this;
  }

  /**
   * Order the results by a field
   */
  order(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder<T> {
    this.orderClauses.push({ field, direction });
    return this;
  }

  /**
   * Select specific fields from the results
   */
  select(...fields: string[]): QueryBuilder<T> {
    this.selectedFields = fields;
    return this;
  }

  /**
   * Limit the number of results
   */
  limit(limit: number): QueryBuilder<T> {
    this.limitValue = limit;
    return this;
  }

  /**
   * Skip a number of results
   */
  offset(offset: number): QueryBuilder<T> {
    this.offsetValue = offset;
    return this;
  }

  /**
   * Don't use cached results
   */
  noCache(): QueryBuilder<T> {
    this.cached = false;
    return this;
  }

  /**
   * Set a path parameter
   */
  withParam(key: string, value: any): QueryBuilder<T> {
    this.params[key] = value;
    return this;
  }

  /**
   * Set multiple path parameters
   */
  withParams(params: Record<string, any>): QueryBuilder<T> {
    this.params = { ...this.params, ...params };
    return this;
  }

  /**
   * Execute the query and return all results
   */
  async all(): Promise<T[]> {
    const queryParams: Record<string, any> = this.buildQueryParams();

    // Handle path parameters
    const pathParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.params)) {
      pathParams[key] = String(value);
    }

    const { data, error } = await client.GET(this.path, {
      params: {
        query: queryParams,
        path: pathParams
      }
    } as any);

    if (error != null) {
      throw new Error(`Failed to fetch ${this.collectionName}: ${error}`);
    }

    let result = data as any[];

    // Apply post-processing filters (for client-side operations)
    if (this.selectedFields.length > 0) {
      result = result.map(item => {
        const selectedItem: Record<string, any> = {};
        for (const field of this.selectedFields) {
          if (field in item) {
            selectedItem[field] = item[field];
          }
        }
        return selectedItem as any;
      });
    }

    return result as T[];
  }

  /**
   * Execute the query and return the first result
   */
  async first(): Promise<T | null> {
    // Limit to 1 result for optimization
    this.limit(1);
    const results = await this.all();
    return results.length > 0 ? results[0] : null;
  }

  private buildQueryParams(): Record<string, any> {
    const params: Record<string, any> = {};

    // Add where clauses
    if (this.whereClauses.length > 0) {
      // This would need to be implemented specifically for your API
      // For now, we'll just convert simple equality filters
      for (const clause of this.whereClauses) {
        if ('field' in clause && clause.operator === '=') {
          params[clause.field] = clause.value;
        }
      }
    }

    // Add order clauses if your API supports it
    if (this.orderClauses.length > 0) {
      params.orderBy = this.orderClauses.map(
        clause => `${clause.field}:${clause.direction}`
      ).join(',');
    }

    // Add pagination if your API supports it
    if (this.limitValue !== null) {
      params.limit = this.limitValue.toString();
    }

    if (this.offsetValue !== null) {
      params.offset = this.offsetValue.toString();
    }

    return params;
  }

  /**
   * Generate static paths for Astro's getStaticPaths function.
   * @param config Configuration for path generation
   */
  async generatePaths<P = any>(config: {
    // Parameter field to use as the route parameter
    paramField: string | ((item: T) => Record<string, string>);
    // Props to include (either field names or a transform function)
    props?: string[] | ((item: T) => P);
  }): Promise<StaticPathItem<P>[]> {
    const results = await this.all();

    return results.map(item => {
      // Generate params
      let params: Record<string, string> = {};

      if (typeof config.paramField === 'function') {
        params = config.paramField(item);
      } else {
        // Use the specified field as the param
        const paramValue = item[config.paramField];
        params = { [config.paramField]: String(paramValue) };
      }

      // Generate props
      let props: any = undefined;

      if (config.props) {
        if (Array.isArray(config.props)) {
          // Include only specified fields
          props = {} as P;
          for (const field of config.props) {
            if (field in item) {
              props[field] = item[field];
            }
          }
        } else if (typeof config.props === 'function') {
          // Use transform function
          props = config.props(item);
        }
      }

      return {
        params,
        props
      };
    });
  }

  /**
   * Generate Astro static paths by combining multiple collections.
   * This is useful for nested routes like [version]/[category]
   * @param nestedQuery Function that returns a query builder for nested items
   * @param config Configuration for nested paths
   */
  async generateNestedPaths<P = any, N = any>(
    nestedQuery: (parentItem: T) => QueryBuilder<N> | Promise<QueryBuilder<N>>,
    config: {
      parentParamField: string | ((item: T) => Record<string, string>);
      childParamField: string | ((item: N, parent: T) => Record<string, string>);
      props?: string[] | ((item: N, parent: T) => P);
    }
  ): Promise<StaticPathItem<P>[]> {
    const parentResults = await this.all();
    const allPaths: StaticPathItem<P>[] = [];

    for (const parent of parentResults) {
      // Get nested query
      const childQueryBuilder = await nestedQuery(parent);
      const childResults = await childQueryBuilder.all();

      // Generate parent params
      let parentParams: Record<string, string> = {};
      if (typeof config.parentParamField === 'function') {
        parentParams = config.parentParamField(parent);
      } else {
        parentParams = { [config.parentParamField]: String(parent[config.parentParamField]) };
      }

      // Generate paths for each child
      for (const child of childResults) {
        let childParams: Record<string, string> = {};
        if (typeof config.childParamField === 'function') {
          childParams = config.childParamField(child, parent);
        } else {
          childParams = { [config.childParamField]: String(child[config.childParamField]) };
        }

        // Combine params
        const params = { ...parentParams, ...childParams };

        // Generate props
        let props: any = undefined;
        if (config.props) {
          if (typeof config.props === 'function') {
            props = config.props(child, parent);
          } else {
            props = {} as P;
            // Include specified properties from parent and child
            for (const field of config.props) {
              if (field in child) {
                props[field] = child[field];
              } else if (field in parent) {
                props[field] = parent[field];
              }
            }
          }
        }

        allPaths.push({ params, props });
      }
    }

    return allPaths;
  }
}

/**
 * Create a query builder for a collection
 */
export function queryCollection<T = any>(collectionName: string, path?: string, params?: Record<string, any>): QueryBuilder<T> {
  return new QueryBuilder<T>(collectionName, path, params);
}

/**
 * Helper function specifically for fetching versions
 */
export function queryVersions() {
  return queryCollection('versions', '/api/v1/versions');
}

/**
 * Helper function specifically for fetching categories
 */
export function queryCategories(version: string) {
  return queryCollection('categories', '/api/v1/categories/{version}', { version });
}

/**
 * Convenience function to generate paths directly from a collection
 */
export async function generatePathsForCollection<T = any, P = any>(
  collectionName: string,
  config: {
    path?: string;
    params?: Record<string, any>;
    paramField: string | ((item: T) => Record<string, string>);
    props?: string[] | ((item: T) => P);
    filter?: (query: QueryBuilder<T>) => QueryBuilder<T>;
  }
): Promise<StaticPathItem<P>[]> {
  let query = queryCollection<T>(collectionName, config.path, config.params);

  if (config.filter) {
    query = config.filter(query);
  }

  return query.generatePaths({
    paramField: config.paramField,
    props: config.props
  });
}

/**
 * Generate paths for versions and their categories (convenience function)
 */
export async function generateVersionCategoryPaths<P = any>(
  config: {
    includeCategories?: boolean;
    versionParamName?: string;
    categoryParamName?: string;
    versionFilter?: (query: QueryBuilder<any>) => QueryBuilder<any>;
    categoryFilter?: (query: QueryBuilder<any>, version: any) => QueryBuilder<any>;
    props?: string[] | ((category: any, version: any) => P);
  } = {}
): Promise<StaticPathItem<P>[]> {
  const {
    includeCategories = true,
    versionParamName = 'version',
    categoryParamName = 'category',
    versionFilter,
    categoryFilter,
    props
  } = config;

  let versionsQuery = queryVersions();

  if (versionFilter) {
    versionsQuery = versionFilter(versionsQuery);
  }

  if (!includeCategories) {
    // Only return version paths
    return versionsQuery.generatePaths({
      paramField: item => ({ [versionParamName]: item.emoji_version }),
      props: Array.isArray(props) ? props : item => item as any
    });
  }

  // Return version + category paths
  return versionsQuery.generateNestedPaths(
    version => {
      let catQuery = queryCategories(version.emoji_version!);
      if (categoryFilter) {
        catQuery = categoryFilter(catQuery, version);
      }
      return catQuery;
    },
    {
      parentParamField: item => ({ [versionParamName]: item.emoji_version }),
      childParamField: (category, _) => ({ [categoryParamName]: category.slug }),
      props: props || ((category, version) => ({
        version: version.emoji_version,
        category
      } as any))
    }
  );
}
