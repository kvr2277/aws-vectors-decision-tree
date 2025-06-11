#!/bin/bash

# AWS Vector Databases Decision Guide Deployment Script
# Deploy to vectors.decision.vinodaws.com

set -e

# Configuration
REGION="us-east-2"
BUCKET_NAME="vectors-decision-vinodaws-com"
DOMAIN_NAME="vectors.decision.vinodaws.com"
PARENT_DOMAIN="vinodaws.com"

echo "🚀 Deploying AWS Vector Databases Decision Guide..."
echo "📍 Region: $REGION"
echo "🪣 Bucket: $BUCKET_NAME"
echo "🌐 Domain: $DOMAIN_NAME"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# 1. Create S3 bucket if it doesn't exist
echo "📦 Creating S3 bucket..."
if ! aws s3api head-bucket --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null; then
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
    echo "✅ S3 bucket created: $BUCKET_NAME"
else
    echo "✅ S3 bucket already exists: $BUCKET_NAME"
fi

# 2. Configure bucket for static website hosting
echo "🌐 Configuring static website hosting..."
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html \
    --region "$REGION"

# 3. Upload website files
echo "📤 Uploading website files..."
aws s3 sync . "s3://$BUCKET_NAME" \
    --region "$REGION" \
    --exclude "*.git/*" \
    --exclude "deploy.sh" \
    --exclude "cloudformation.yaml" \
    --exclude "README.md" \
    --exclude "ToDo.md" \
    --delete

# 4. Set proper content types
echo "🏷️ Setting content types..."
aws s3 cp "s3://$BUCKET_NAME/index.html" "s3://$BUCKET_NAME/index.html" \
    --content-type "text/html" \
    --metadata-directive REPLACE \
    --region "$REGION"

aws s3 cp "s3://$BUCKET_NAME/styles.css" "s3://$BUCKET_NAME/styles.css" \
    --content-type "text/css" \
    --metadata-directive REPLACE \
    --region "$REGION"

aws s3 cp "s3://$BUCKET_NAME/script.js" "s3://$BUCKET_NAME/script.js" \
    --content-type "application/javascript" \
    --metadata-directive REPLACE \
    --region "$REGION"

# 5. Get the hosted zone ID for the parent domain
echo "🔍 Finding Route 53 hosted zone..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
    --dns-name "$PARENT_DOMAIN" \
    --query "HostedZones[0].Id" \
    --output text | cut -d'/' -f3)

if [ "$HOSTED_ZONE_ID" = "None" ]; then
    echo "❌ Hosted zone for $PARENT_DOMAIN not found"
    exit 1
fi

echo "✅ Found hosted zone: $HOSTED_ZONE_ID"

# 6. Request SSL certificate in us-east-1 (required for CloudFront)
echo "🔒 Requesting SSL certificate..."
CERT_ARN=$(aws acm request-certificate \
    --domain-name "$DOMAIN_NAME" \
    --validation-method DNS \
    --region us-east-1 \
    --query "CertificateArn" \
    --output text)

echo "🔒 Certificate requested: $CERT_ARN"
echo "⏳ Waiting for certificate validation record..."

# Wait for validation record to be available
sleep 10

# Get validation record
VALIDATION_RECORD=$(aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region us-east-1 \
    --query "Certificate.DomainValidationOptions[0].ResourceRecord" \
    --output json)

VALIDATION_NAME=$(echo "$VALIDATION_RECORD" | jq -r '.Name')
VALIDATION_VALUE=$(echo "$VALIDATION_RECORD" | jq -r '.Value')

# Create DNS validation record
echo "📝 Creating DNS validation record..."
aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "{
        \"Changes\": [{
            \"Action\": \"CREATE\",
            \"ResourceRecordSet\": {
                \"Name\": \"$VALIDATION_NAME\",
                \"Type\": \"CNAME\",
                \"TTL\": 300,
                \"ResourceRecords\": [{
                    \"Value\": \"$VALIDATION_VALUE\"
                }]
            }
        }]
    }"

echo "⏳ Waiting for certificate validation (this may take 5-10 minutes)..."
aws acm wait certificate-validated \
    --certificate-arn "$CERT_ARN" \
    --region us-east-1

echo "✅ Certificate validated!"

# 7. Create CloudFront distribution
echo "☁️ Creating CloudFront distribution..."
DISTRIBUTION_CONFIG=$(cat <<EOF
{
    "CallerReference": "vector-db-guide-$(date +%s)",
    "Comment": "AWS Vector Databases Decision Guide",
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 7,
            "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {"Forward": "none"}
        },
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true
    },
    "Origins": {
        "Quantity": 1,
        "Items": [{
            "Id": "S3-$BUCKET_NAME",
            "DomainName": "$BUCKET_NAME.s3-website.$REGION.amazonaws.com",
            "CustomOriginConfig": {
                "HTTPPort": 80,
                "HTTPSPort": 443,
                "OriginProtocolPolicy": "http-only"
            }
        }]
    },
    "Aliases": {
        "Quantity": 1,
        "Items": ["$DOMAIN_NAME"]
    },
    "ViewerCertificate": {
        "ACMCertificateArn": "$CERT_ARN",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [{
            "ErrorCode": 404,
            "ResponsePagePath": "/index.html",
            "ResponseCode": "200",
            "ErrorCachingMinTTL": 300
        }]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
EOF
)

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config "$DISTRIBUTION_CONFIG" \
    --query "Distribution.Id" \
    --output text)

echo "☁️ CloudFront distribution created: $DISTRIBUTION_ID"

# Get CloudFront domain name
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
    --id "$DISTRIBUTION_ID" \
    --query "Distribution.DomainName" \
    --output text)

echo "⏳ Waiting for CloudFront distribution to deploy..."
aws cloudfront wait distribution-deployed --id "$DISTRIBUTION_ID"

# 8. Create Route 53 record
echo "🌐 Creating Route 53 record..."
aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "{
        \"Changes\": [{
            \"Action\": \"CREATE\",
            \"ResourceRecordSet\": {
                \"Name\": \"$DOMAIN_NAME\",
                \"Type\": \"A\",
                \"AliasTarget\": {
                    \"HostedZoneId\": \"Z2FDTNDATAQYW2\",
                    \"DNSName\": \"$CLOUDFRONT_DOMAIN\",
                    \"EvaluateTargetHealth\": false
                }
            }
        }]
    }"

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "   🪣 S3 Bucket: $BUCKET_NAME"
echo "   ☁️ CloudFront Distribution: $DISTRIBUTION_ID"
echo "   🔒 SSL Certificate: $CERT_ARN"
echo "   🌐 Website URL: https://$DOMAIN_NAME"
echo ""
echo "⏳ Note: DNS propagation may take 5-15 minutes"
echo "🔗 Your website will be available at: https://$DOMAIN_NAME"
echo "" 