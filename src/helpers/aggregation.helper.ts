import mongoose, { Model } from "mongoose";

type AggregationArgs<T> = {
  model: Model<T>;
  args: mongoose.PipelineStage[];
  perPage?: number;
  pageNo?: number;
};

export const aggregationHelper = async <T>({
  model,
  args,
  perPage,
  pageNo,
}: AggregationArgs<T>) =>
  new Promise(async (resolve, reject) => {
    try {
      let pagination = [];

      if (perPage) {
        pagination.push(
          {
            $limit: Number(perPage),
          },
          {
            $skip: (Number(pageNo || 0) - 1) * Number(perPage),
          }
        );
      }

      const [firstPromise, secondPromise] = await Promise.allSettled([
        model.aggregate([
          ...args,
          {
            $count: "totalCount",
          },
        ]),
        model.aggregate([...args, ...pagination]),
      ]);

      if (firstPromise?.status === "rejected")
        throw new Error(firstPromise?.reason?.message);
      if (secondPromise?.status === "rejected")
        throw new Error(secondPromise?.reason?.message);

      const totalLength = secondPromise.value?.length;
      if (totalLength > Number(perPage)) secondPromise.value.pop();

      resolve({
        data: secondPromise.value,
        isLastChunk: !(totalLength > Number(perPage)),
        totalCount: firstPromise?.value[0]?.totalCount,
        perPage: Number(perPage),
        pageNo: Number(pageNo),
      });
    } catch (error) {
      reject(error);
    }
  });
