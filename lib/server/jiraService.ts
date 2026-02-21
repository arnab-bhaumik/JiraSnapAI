import axios from 'axios';
import FormData from 'form-data';
import { JiraConfig } from './types';

/**
 * Build the Base64 auth header for Jira Cloud (email:apiToken).
 */
function getAuthHeader(config: JiraConfig): string {
    const credentials = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    return `Basic ${credentials}`;
}

/**
 * Test Jira connection by hitting GET /rest/api/3/myself
 */
export async function testJiraConnection(
    config: JiraConfig
): Promise<{ success: boolean; message: string }> {
    try {
        const url = `${config.jiraUrl.replace(/\/+$/, '')}/rest/api/3/myself`;
        const response = await axios.get(url, {
            headers: {
                Authorization: getAuthHeader(config),
                'Content-Type': 'application/json',
            },
        });
        return {
            success: true,
            message: `Jira connection successful! Authenticated as: ${response.data.displayName}`,
        };
    } catch (error: any) {
        const status = error?.response?.status;
        let msg = error?.message || 'Unknown error';
        if (status === 401) msg = 'Authentication failed. Check your email and API token.';
        else if (status === 403) msg = 'Forbidden. Check your permissions.';
        else if (status === 404) msg = 'Jira URL not found. Check the URL.';
        return { success: false, message: `Jira connection failed: ${msg}` };
    }
}

/**
 * Create a Bug ticket in Jira and optionally attach the screenshot.
 */
export async function createBugTicket(
    config: JiraConfig,
    summary: string,
    description: string,
    screenshotBase64?: string,
    mimeType?: string
): Promise<{ ticketKey: string }> {
    const baseUrl = config.jiraUrl.replace(/\/+$/, '');
    const authHeader = getAuthHeader(config);

    // 1. Create the issue
    const createUrl = `${baseUrl}/rest/api/3/issue`;
    const issuePayload = {
        fields: {
            project: { key: config.projectName },
            summary,
            description: {
                type: 'doc',
                version: 1,
                content: [
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: description }],
                    },
                ],
            },
            issuetype: { name: config.issueType || 'Bug' },
        },
    };

    let createResponse;
    try {
        createResponse = await axios.post(createUrl, issuePayload, {
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
        });
    } catch (error: any) {
        if (error.response && error.response.data) {
            console.error('Jira Issue Creation Error Details:', JSON.stringify(error.response.data, null, 2));
            throw new Error(`Jira API Error: ${JSON.stringify(error.response.data.errors || error.response.data.errorMessages)}`);
        }
        throw error;
    }

    const ticketKey: string = createResponse.data.key;

    // 2. Attach screenshot if provided
    if (screenshotBase64 && mimeType) {
        try {
            const attachUrl = `${baseUrl}/rest/api/3/issue/${ticketKey}/attachments`;
            const buffer = Buffer.from(screenshotBase64, 'base64');
            const ext = mimeType.split('/')[1] || 'png';

            const form = new FormData();
            form.append('file', buffer, {
                filename: `screenshot.${ext}`,
                contentType: mimeType,
            });

            await axios.post(attachUrl, form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: authHeader,
                    'X-Atlassian-Token': 'no-check',
                },
            });
        } catch (attachError: any) {
            console.error('Warning: Failed to attach screenshot:', attachError?.message);
            // Don't fail the whole operation if attachment fails
        }
    }

    return { ticketKey };
}


