# S3 Image Storage Setup Guide

This application now stores label images, print PDFs, and bottle snapshots in AWS S3 instead of MongoDB base64 strings.

## Environment Variables

Add these to your `backend/.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name

# Optional: For S3-compatible services (DigitalOcean Spaces, Wasabi, etc.)
AWS_S3_ENDPOINT=
AWS_S3_FORCE_PATH_STYLE=false
```

## Setup Steps

### 1. Create AWS S3 Bucket

1. Go to AWS Console → S3
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `ninexfold-label-images`)
4. Select your region (e.g., `us-east-1`)
5. **Uncheck "Block all public access"** if you want public image URLs
   - Or use CloudFront CDN for better performance
6. Create bucket

### 2. Create IAM User with S3 Access

1. Go to AWS Console → IAM → Users
2. Click "Create user"
3. Name: `s3-upload-user` (or any name)
4. Attach policy: `AmazonS3FullAccess` (or create custom policy with only needed permissions)
5. Create Access Key
6. Download credentials (you'll only see the secret once!)

### 3. Update .env File

Copy the Access Key ID and Secret Access Key to your `.env` file.

### 4. Bucket Permissions (Required for Public Access)

**Important**: New S3 buckets (created after April 2023) have ACLs disabled by default. You must use bucket policies for public access.

If you want public read access to images:

1. Go to your S3 bucket → **Permissions** tab
2. Scroll to **Bucket policy** → Click **Edit**
3. Add this policy (replace `your-bucket-name` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

4. Click **Save changes**

**Note**: If you don't set up public access, images will be private and only accessible via signed URLs. For public image serving, the bucket policy above is required.

## Migration

To migrate existing base64 images to S3:

```bash
npm run migrate-s3
```

This script will:
- Find all designs and orders with base64 images
- Upload them to S3
- Update the database with S3 URLs

## How It Works

1. **New Designs**: When a design is saved with base64 images, they are automatically uploaded to S3 and the S3 URL is stored in MongoDB.

2. **Existing Designs**: The migration script converts existing base64 images to S3 URLs.

3. **Image Organization**: Images are organized in S3 by type:
   - `label-images/` - Label images
   - `print-pdfs/` - Print PDFs
   - `bottle-snapshots/` - Bottle snapshots

4. **File Naming**: Files are named with timestamp and random string for uniqueness:
   - Format: `{type}/{timestamp}-{random}.{extension}`
   - Example: `label-images/1706541234567-a1b2c3d4e5f6g7h8.png`

## S3-Compatible Services

You can use S3-compatible services like DigitalOcean Spaces or Wasabi:

### DigitalOcean Spaces

```env
AWS_ACCESS_KEY_ID=your-spaces-key
AWS_SECRET_ACCESS_KEY=your-spaces-secret
AWS_REGION=nyc3
AWS_S3_BUCKET_NAME=your-space-name
AWS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
AWS_S3_FORCE_PATH_STYLE=true
```

### Wasabi

```env
AWS_ACCESS_KEY_ID=your-wasabi-key
AWS_SECRET_ACCESS_KEY=your-wasabi-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_S3_ENDPOINT=https://s3.wasabisys.com
AWS_S3_FORCE_PATH_STYLE=true
```

## Troubleshooting

### Error: "Access Denied"
- Check IAM user has S3 permissions
- Verify bucket name is correct
- Check region matches

### Error: "Bucket not found"
- Verify bucket name in `.env`
- Check region is correct
- Ensure bucket exists in AWS Console

### Images not loading
- **Check bucket policy** - Ensure bucket policy allows public read access (see step 4 in setup)
- Verify S3 URLs are correct in database
- Check CORS settings if loading from browser
- If using private bucket, you'll need signed URLs instead

### Error: "AccessControlListNotSupported" or "The bucket does not allow ACLs"
- This is normal for new S3 buckets (ACLs disabled by default)
- **Solution**: Remove ACL parameter (already fixed in code) and use bucket policy instead
- Make sure you've set up the bucket policy as described in step 4

### Migration fails
- Ensure all environment variables are set
- Check AWS credentials are valid
- Verify bucket exists and is accessible

## Cost Considerations

- **S3 Storage**: ~$0.023 per GB/month
- **PUT Requests**: ~$0.005 per 1,000 requests
- **GET Requests**: ~$0.0004 per 1,000 requests
- **Data Transfer Out**: First 1GB free, then ~$0.09 per GB

For a typical e-commerce site with 1,000 designs:
- Storage: ~2GB = $0.05/month
- Requests: Minimal cost
- **Total: ~$0.10-0.50/month**

## Security Best Practices

1. **Use IAM roles** instead of access keys when possible (e.g., on EC2)
2. **Limit permissions** - only grant S3 read/write to specific bucket
3. **Rotate keys** periodically
4. **Use CloudFront** for CDN and better security
5. **Enable versioning** for important images
6. **Set up lifecycle policies** to delete old images if needed

## Next Steps

- [ ] Set up CloudFront CDN for faster image delivery
- [ ] Configure image optimization (resize, compress)
- [ ] Set up backup/versioning
- [ ] Monitor S3 costs
- [ ] Set up alerts for unusual activity

