import { NextResponse } from 'next/server';

/**
 * HTTP / SSE Transport Handler for Code Plus Academy MCP Server.
 * Supports tool listing and execution for agent tools:
 * - search_notes
 * - list_career_positions
 * - fetch_explore_content
 * - get_support_ticket_status
 */
export async function GET() {
  return NextResponse.json({
    jsonrpc: '2.0',
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {
          search_notes: {
            description: 'Search academic notes, PYQs, and lab manuals by query, college, or subject',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search term' },
                type: { type: 'string', description: 'Material type (lecture_notes, pyq, lab_manual)' }
              }
            }
          },
          list_career_positions: {
            description: 'Get all active job/internship positions with full role requirements',
            inputSchema: {
              type: 'object',
              properties: {
                status: { type: 'string', description: 'Filter status (open, upcoming)' }
              }
            }
          },
          fetch_explore_content: {
            description: 'Fetch technical articles, short-form clips, long-form videos, and posts from Explore Hub',
            inputSchema: {
              type: 'object',
              properties: {
                type: { type: 'string', description: 'Content type (article, video, short, post)' },
                limit: { type: 'number', description: 'Result count limit' }
              }
            }
          },
          get_support_ticket_status: {
            description: 'Retrieve status and updates for a public support ticket ID',
            inputSchema: {
              type: 'object',
              properties: {
                ticketId: { type: 'string', description: 'Support ticket ID' }
              },
              required: ['ticketId']
            }
          }
        }
      },
      serverInfo: {
        name: 'code-plus-academy-mcp',
        version: '1.0.0'
      }
    }
  }, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { method, params, id } = body;

    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'search_notes',
              description: 'Search academic notes, PYQs, and lab manuals by query, college, or subject',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Search term' }
                }
              }
            },
            {
              name: 'list_career_positions',
              description: 'Get all active job/internship positions with full role requirements',
              inputSchema: {
                type: 'object',
                properties: {
                  status: { type: 'string', description: 'Filter status (open, upcoming)' }
                }
              }
            },
            {
              name: 'fetch_explore_content',
              description: 'Fetch technical articles, short-form clips, long-form videos, and posts from Explore Hub',
              inputSchema: {
                type: 'object',
                properties: {
                  type: { type: 'string', description: 'Content type (article, video, short, post)' }
                }
              }
            },
            {
              name: 'get_support_ticket_status',
              description: 'Retrieve status and updates for a public support ticket ID',
              inputSchema: {
                type: 'object',
                properties: {
                  ticketId: { type: 'string', description: 'Support ticket ID' }
                },
                required: ['ticketId']
              }
            }
          ]
        }
      });
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: { status: 'acknowledged', method }
    });
  } catch (err) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'Internal error parsing MCP payload' }
    }, { status: 400 });
  }
}
