import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter ={
  audioUpload: f({
    audio:{
      maxFileSize: "64MB",
      minFileCount:1,
    }
  })
  .onUploadComplete(async({file}) => {
    console.log("File uploaded:",file.ufsUrl);

    return {
      url: file.ufsUrl,
    };
  }),
} satisfies FileRouter;

export type   UploadRouter = typeof uploadRouter;