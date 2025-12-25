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
	_ = godotenv.Load(".env")

	accessKey := firstNonEmpty(
		os.Getenv("AWS_ACCESS_KEY_ID"),
		os.Getenv("YC_S3_API_KEY"),
	)
	secretKey := firstNonEmpty(
		os.Getenv("AWS_SECRET_ACCESS_KEY"),
		os.Getenv("YC_S3_API_SECRET"),
	)
	bucket := firstNonEmpty(
		os.Getenv("AWS_BUCKET"),
		os.Getenv("S3_BUCKET"),
		os.Getenv("YC_S3_BUCKET"),
	)
	region := firstNonEmpty(
		os.Getenv("AWS_REGION"),
		os.Getenv("AWS_DEFAULT_REGION"),
		os.Getenv("S3_REGION"),
		os.Getenv("YC_S3_REGION"),
		"ru-central1",
	)
	endpoint := firstNonEmpty(
		os.Getenv("AWS_ENDPOINT"),
		os.Getenv("S3_ENDPOINT"),
		os.Getenv("YC_S3_ENDPOINT"),
		"https://storage.yandexcloud.net",
	)

	missing := missingVars(map[string]string{
		"AWS_ACCESS_KEY_ID (or YC_S3_API_KEY)":          accessKey,
		"AWS_SECRET_ACCESS_KEY (or YC_S3_API_SECRET)":   secretKey,
		"AWS_BUCKET (or S3_BUCKET or YC_S3_BUCKET)":     bucket,
	})
	if len(missing) > 0 {
		return nil, fmt.Errorf("missing required environment variables: %s", joinComma(missing))
	}
	creds := credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")

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

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

func missingVars(values map[string]string) []string {
	var missing []string
	for name, value := range values {
		if value == "" {
			missing = append(missing, name)
		}
	}
	return missing
}

func joinComma(values []string) string {
	if len(values) == 0 {
		return ""
	}
	s := values[0]
	for i := 1; i < len(values); i++ {
		s += ", " + values[i]
	}
	return s
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
