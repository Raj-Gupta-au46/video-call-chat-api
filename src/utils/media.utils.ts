import { v2 as cloudinary } from "cloudinary";
import { UploadedFile } from "express-fileupload";
import fs from "fs";
import { ImageType } from "../types/core";

class MediaLogic {
  constructor() {
    this.cloudinaryConfig();
  }

  //   cloudinary config
  public cloudinaryConfig() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  public uploadMedia(
    file: UploadedFile,
    folder?: string
  ): Promise<{ url: string; path: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: `vChat/${folder || "common"}`,
        });
        fs.unlinkSync(file.tempFilePath);
        fs.rm(`../../temp/${file.tempFilePath}`, { recursive: true }, () => {});
        resolve({
          url: result.secure_url,
          path: result.public_id,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public uploadMultipleMedia(
    files: UploadedFile[],
    folder?: string
  ): Promise<ImageType[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let resultArray: ImageType[] = [];
        for (const file of files) {
          // upload media
          const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: `vChat/${folder || "common"}`,
          });
          // delete temp file
          fs.unlinkSync(file.tempFilePath);
          fs.rm(
            `../../temp/${file.tempFilePath}`,
            { recursive: true },
            () => {}
          );

          // push result to result array
          resultArray.push({
            url: result.secure_url,
            path: result.public_id,
          });
        }
        // send response to client
        resolve(resultArray);
      } catch (error) {
        reject(error);
      }
    });
  }

  // delete media
  public deleteMedia(path: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await cloudinary.uploader.destroy(path);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  //delete multiple media
  public deleteMultipleMedia(paths: string[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        for (const path of paths) {
          await cloudinary.uploader.destroy(path);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default MediaLogic;
