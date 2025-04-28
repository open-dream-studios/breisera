import AWS from "aws-sdk";

// Set up S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: "v4",
});

export async function uploadToS3({ Bucket, Key, Body, ContentType }) {
  const params = { Bucket, Key, Body, ContentType };
  await s3.upload(params).promise();
}

export async function getSignedUrl(key) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Expires: 60 * 5,
    ResponseContentDisposition: `attachment; filename="${key}"`,
    ResponseContentType: "video/mp4",
  };

  const url = await s3.getSignedUrlPromise("getObject", params);
  return url;
}

export async function deleteFromBucket(video_name) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: video_name,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (err) {
    console.error(`❌ Failed to delete ${video_name}:`, err);
  }
}
