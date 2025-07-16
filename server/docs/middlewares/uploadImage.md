# uploadImage.js

This file contains the configuration for uploading images to AWS S3 using `multer` and `multer-s3`.

## Import Statements

- `multer`: This is a middleware for handling `multipart/form-data`, which is primarily used for uploading files.
- `multer-s3`: This is a middleware for `multer` to upload files directly to AWS S3.
- `S3Client`: This is a client object for the AWS S3 service, imported from the `@aws-sdk/client-s3` library.
- `path`: This is a Node.js built-in module for handling and transforming file paths.

## S3 Client Configuration

An instance of `S3Client` is created with the AWS credentials and region specified. The credentials are fetched from the environment variables `AWS_SECRET_ID` and `AWS_SECRET_KEY`. The region is set to "ap-south-1".

## Multer S3 Storage Configuration

The `multerS3` function is called with an object that specifies the configuration for storing files in S3. The configuration includes:

- `s3`: The S3 client instance.
- `bucket`: The name of the S3 bucket where the files will be stored. In this case, it's "reported-images".
- `acl`: The Access Control List (ACL) for the uploaded files. It's set to "public-read", which means the files are publicly readable.
- `contentType`: The content type of the uploaded files. It's set to `multerS3.AUTO_CONTENT_TYPE`, which means the content type will be automatically set based on the file.
- `metadata`: A function that sets the metadata for the uploaded files. It sets the `fieldname` metadata to the fieldname of the file.
- `key`: A function that sets the key (file name) for the uploaded files. It sets the key to a string that includes the current timestamp, the fieldname of the file, and the original name of the file.

## Sanitize File Function

This function checks if the extension of a file is allowed. The allowed extensions are ".png", ".jpg", ".jpeg", and ".gif". The function is not complete in the provided code.
