import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable()
export class DnsheApiService {
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('DNSHE_API_BASE_URL') || 'https://api.dnshe.com/v1';
  }

  private getHeaders(apiKey: string, apiSecret: string) {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'X-API-Secret': apiSecret,
      'Content-Type': 'application/json',
    };
  }

  async getDomains(apiKey: string, apiSecret: string) {
    const response = await fetch(`${this.baseUrl}/domains`, {
      headers: this.getHeaders(apiKey, apiSecret),
    });
    return response.json();
  }

  async getDnsRecords(apiKey: string, apiSecret: string, domainId: string) {
    const response = await fetch(`${this.baseUrl}/domains/${domainId}/records`, {
      headers: this.getHeaders(apiKey, apiSecret),
    });
    return response.json();
  }

  async createDnsRecord(apiKey: string, apiSecret: string, domainId: string, data: any) {
    const response = await fetch(`${this.baseUrl}/domains/${domainId}/records`, {
      method: 'POST',
      headers: this.getHeaders(apiKey, apiSecret),
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateDnsRecord(apiKey: string, apiSecret: string, domainId: string, recordId: string, data: any) {
    const response = await fetch(`${this.baseUrl}/domains/${domainId}/records/${recordId}`, {
      method: 'PUT',
      headers: this.getHeaders(apiKey, apiSecret),
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteDnsRecord(apiKey: string, apiSecret: string, domainId: string, recordId: string) {
    const response = await fetch(`${this.baseUrl}/domains/${domainId}/records/${recordId}`, {
      method: 'DELETE',
      headers: this.getHeaders(apiKey, apiSecret),
    });
    return response.json();
  }

  async getWhois(apiKey: string, apiSecret: string, domain: string) {
    const response = await fetch(`${this.baseUrl}/whois/${domain}`, {
      headers: this.getHeaders(apiKey, apiSecret),
    });
    return response.json();
  }

  async checkRenew(apiKey: string, apiSecret: string, domain: string) {
    const response = await fetch(`${this.baseUrl}/domains/${domain}/renew`, {
      headers: this.getHeaders(apiKey, apiSecret),
    });
    return response.json();
  }

  async getStatus(apiKey: string, apiSecret: string) {
    const response = await fetch(`${this.baseUrl}/status`, {
      headers: this.getHeaders(apiKey, apiSecret),
    });
    return response.json();
  }

  async getUsage(apiKey: string, apiSecret: string) {
    const response = await fetch(`${this.baseUrl}/usage`, {
      headers: this.getHeaders(apiKey, apiSecret),
    });
    return response.json();
  }
}
