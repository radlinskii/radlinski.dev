package main

import (
	"fmt"
	"infra/cloudflare"
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	iam "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	s3 "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type StaticSiteStackProps struct {
	awscdk.StackProps
}

func NewStaticSiteStack(
	scope constructs.Construct,
	id string,
	props *StaticSiteStackProps,
) (awscdk.Stack, error) {
	stack := awscdk.NewStack(scope, &id, &props.StackProps)

	websiteBucket := s3.NewBucket(
		stack,
		jsii.String(os.Getenv("STATIC_SITE_BUCKET")),
		&s3.BucketProps{
			BucketName:           jsii.String(os.Getenv("STATIC_SITE_BUCKET")),
			WebsiteIndexDocument: jsii.String("index.html"),
			WebsiteErrorDocument: jsii.String("error.html"),
			RemovalPolicy:        awscdk.RemovalPolicy_DESTROY,
			AutoDeleteObjects:    jsii.Bool(true),
		},
	)

	allowedIPs, err := cloudflare.GetCloudflareIPs()
	if err != nil {
		fmt.Println("Error fetching Cloudflare IPs:", err)

		return nil, err
	}

	websiteBucket.AddToResourcePolicy(iam.NewPolicyStatement(&iam.PolicyStatementProps{
		Actions: jsii.Strings("s3:GetObject"),
		Effect:  iam.Effect_ALLOW,
		Principals: &[]iam.IPrincipal{
			iam.NewAnyPrincipal(),
		},
		Resources: jsii.Strings(
			*websiteBucket.BucketArn() + "/*",
		),
		Conditions: &map[string]interface{}{
			"IpAddress": map[string]interface{}{
				"aws:SourceIp": allowedIPs,
			},
		},
	}))

	websiteBucket.AddToResourcePolicy(iam.NewPolicyStatement(&iam.PolicyStatementProps{
		Actions: jsii.Strings("s3:GetObject"),
		Effect:  iam.Effect_DENY,
		Principals: &[]iam.IPrincipal{
			iam.NewAnyPrincipal(),
		},
		Resources: jsii.Strings(
			*websiteBucket.BucketArn() + "/*",
		),
		Conditions: &map[string]interface{}{
			"NotIpAddress": map[string]interface{}{
				"aws:SourceIp": allowedIPs,
			},
		},
	}))

	awscdk.NewCfnOutput(stack, jsii.String("WebsiteBucketURL"), &awscdk.CfnOutputProps{
		Value: websiteBucket.BucketWebsiteUrl(),
	})

	redirectBucket := s3.NewBucket(
		stack,
		jsii.String(os.Getenv("REDIRECT_SITE_BUCKET")),
		&s3.BucketProps{
			BucketName: jsii.String(os.Getenv("REDIRECT_SITE_BUCKET")),
			WebsiteRedirect: &s3.RedirectTarget{
				HostName: websiteBucket.BucketWebsiteDomainName(),
			},
			RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
			AutoDeleteObjects: jsii.Bool(true),
		},
	)

	awscdk.NewCfnOutput(stack, jsii.String("RedirectBucketURL"), &awscdk.CfnOutputProps{
		Value: redirectBucket.BucketWebsiteUrl(),
	})

	return stack, nil
}

func main() {
	app := awscdk.NewApp(nil)

	_, err := NewStaticSiteStack(app, "StaticSiteStack", &StaticSiteStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})
	if err != nil {
		fmt.Println("Error creating Static Site Stack:", err)
		return
	}

	app.Synth(nil)
}

func env() *awscdk.Environment {
	return &awscdk.Environment{
		Account: jsii.String(os.Getenv("AWS_ACCOUNT_ID")),
		Region:  jsii.String(os.Getenv("AWS_REGION")),
	}
}
