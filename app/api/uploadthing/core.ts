import { checkSession } from "@/utils/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();


export const ourFileRouter = {
    imageUploader: f({
        image: {
            maxFileSize: "8MB",
            maxFileCount: 1,
        },
    }).middleware(async ({ req }) => {
        const session = await checkSession()
        if (!session) throw new UploadThingError("Unauthorized");
        return { userEmail: session.user.email };
    })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for user:", metadata.userEmail);

            console.log("file url", file.ufsUrl);


            return { uploadedBy: metadata.userEmail };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
