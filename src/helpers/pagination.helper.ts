import { Model } from "mongoose";
type Pagination = {
  model: Model<any>;
  query: any;
  pageNo: any;
  perPage: any;
  sort?: any;
  populate?: any;
  select?: any;
};

export type PaginationResult<T> = {
  data: T[];
  isLastChunk: boolean;
  totalCount?: number;
  perPage?: number;
  pageNo?: number;
};

export default <T>({
  model,
  query,
  pageNo,
  perPage,
  sort = { createdAt: -1 },
  populate,
  select,
}: Pagination): Promise<PaginationResult<T>> =>
  new Promise(async (resolve, reject) => {
    try {
      const [firstPromise, secondPromise] = await Promise.allSettled([
        model
          .find(query)
          .sort(sort)
          .skip((Number(pageNo || 0) - 1) * Number(perPage))
          .limit(Number(perPage) + 1)
          .populate(populate)
          .select(select),
        model.find(query).count(),
      ]);

      if (firstPromise?.status === "rejected")
        throw new Error(firstPromise?.reason?.message);
      if (secondPromise?.status === "rejected")
        throw new Error(secondPromise?.reason?.message);

      const totalLength = firstPromise.value?.length;
      if (totalLength > Number(perPage)) firstPromise.value.pop();
      resolve({
        data: firstPromise.value,
        isLastChunk: !(totalLength > Number(perPage)),
        totalCount: secondPromise?.value,
        perPage: Number(perPage),
        pageNo: Number(pageNo),
      });
    } catch (error) {
      reject(error);
    }
  });
