package cloudflare

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type CloudflareIPResponse struct {
	Result struct {
		IPv4 []string `json:"ipv4_cidrs"`
		IPv6 []string `json:"ipv6_cidrs"`
	} `json:"result"`
	Success  bool  `json:"success"`
	Errors   []any `json:"errors"`
	Messages []any `json:"messages"`
}

// https://developers.cloudflare.com/api/operations/cloudflare-i-ps-cloudflare-ip-details
func GetCloudflareIPs() ([]string, error) {
	url := "https://api.cloudflare.com/client/v4/ips"

	req, err := http.NewRequest("GET", url, bytes.NewBuffer([]byte{}))
	if err != nil {
		return nil, fmt.Errorf("error creating the request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making the request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading the response body: %w", err)
	}

	var response CloudflareIPResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("error unmarshalling JSON: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to retrieve IP addresses: %v", response.Errors)
	}

	return response.Result.IPv4, nil
}
