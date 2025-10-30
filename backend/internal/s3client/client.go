package s3client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/joho/godotenv"
)

type Client struct {
	svc      *s3.Client
	bucket   string
	endpoint string
}

func New() (*Client, error) {

	if err := godotenv.Load(".env"); err != nil {
		fmt.Println("Warning: .env file not found, using environment variables")
	}
	access_key := os.Getenv("AWS_ACCESS_KEY_ID")
	secret_key := os.Getenv("AWS_SECRET_ACCESS_KEY")
	region := os.Getenv("AWS_REGION")
	bucket := os.Getenv("AWS_BUCKET")
	endpoint := os.Getenv("AWS_ENDPOINT")

	if endpoint == "" || region == "" || bucket == "" || access_key == "" || secret_key == "" {
		return nil, fmt.Errorf("missing required environment variables")
	}
	creds := credentials.NewStaticCredentialsProvider(access_key, secret_key, "")

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(creds),
		config.WithEndpointResolver(
			aws.EndpointResolverFunc(func(service, region string) (aws.Endpoint, error) {
				return aws.Endpoint{URL: endpoint, SigningRegion: region}, nil
			}),
		),
	)
	if err != nil {
		fmt.Println(err)
	}

	svc := s3.NewFromConfig(cfg)

	return &Client{
		svc:      svc,
		bucket:   bucket,
		endpoint: endpoint,
	}, nil
}

func (c *Client) UploadFile(ctx context.Context, file multipart.File, filename string) (string, error) {
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return "", err
	}

	key := fmt.Sprintf("uploads/%s", filename)

	output, err := c.svc.PutObject(ctx, &s3.PutObjectInput{
		Bucket: &c.bucket,
		Key:    &key,
		Body:   bytes.NewReader(data),
	})
	if err != nil {
		return "", err
	}
	fmt.Println(output)

	url := fmt.Sprintf("%s/%s/%s", c.endpoint, c.bucket, key)
	fmt.Println(url)

	return url, nil
}

func (c *Client) DeleteFile(ctx context.Context, filename string) error {
	key := fmt.Sprintf("uploads/%s", filename)

	output, err := c.svc.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: &c.bucket,
		Key:    &key,
	})
	if err != nil {
		return err
	}

    data, _ := json.Marshal(output)
    fmt.Println(string(data))
	return nil
}

func (c *Client) ShowFiles(ctx context.Context) {

	result, err := c.svc.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket: aws.String(c.bucket),
	})
	if err != nil {
		fmt.Println(err)
	}

	for _, object := range result.Contents {
		fmt.Printf("object=%s size=%d Bytes last modified=%s \n", aws.ToString(object.Key), aws.ToInt64(object.Size), object.LastModified.Local().Format("2006-01-02 15:04:05 Monday"))
	}
}
