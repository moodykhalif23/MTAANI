import { NextRequest, NextResponse } from 'next/server'
import { apiKeyService } from '@/lib/services/api-key-service'
import { withSecurity } from '@/lib/middleware/api-security'

// GET /api/admin/api-keys - List API keys
export async function GET(request: NextRequest) {
  return withSecurity(request, {
    adminOnly: true,
    rateLimit: {
      requests: 100,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  }, async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status') as 'active' | 'inactive' | 'revoked' | undefined
      const limit = parseInt(searchParams.get('limit') || '50')
      const skip = parseInt(searchParams.get('skip') || '0')

      const result = await apiKeyService.listAPIKeys(
        { status },
        { limit, skip }
      )

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to list API keys' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          apiKeys: result.keys,
          total: result.keys?.length || 0,
          limit,
          skip
        }
      })

    } catch (error) {
      console.error('List API keys error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

// POST /api/admin/api-keys - Create new API key
export async function POST(request: NextRequest) {
  return withSecurity(request, {
    adminOnly: true,
    rateLimit: {
      requests: 10,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  }, async (request: NextRequest) => {
    try {
      const body = await request.json()
      const {
        name,
        description,
        permissions,
        rateLimit,
        restrictions,
        expiresAt
      } = body

      // Validate required fields
      if (!name || !permissions || !Array.isArray(permissions)) {
        return NextResponse.json(
          { error: 'Missing required fields: name, permissions' },
          { status: 400 }
        )
      }

      // Validate permissions
      const validPermissions = [
        'api:read',
        'api:write',
        'api:*',
        'admin:read',
        'admin:write',
        'admin:*',
        'internal:*',
        '*'
      ]

      const invalidPermissions = permissions.filter((perm: string) =>
        !validPermissions.includes(perm)
      )

      if (invalidPermissions.length > 0) {
        return NextResponse.json(
          {
            error: 'Invalid permissions',
            invalidPermissions
          },
          { status: 400 }
        )
      }

      const result = await apiKeyService.createAPIKey({
        name: name.trim(),
        description: description?.trim(),
        permissions,
        rateLimit: rateLimit || {
          requests: 1000,
          windowMs: 60 * 60 * 1000
        },
        restrictions: restrictions || {},
        expiresAt,
        createdBy: 'admin' // In production, get from authenticated user
      })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to create API key' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          keyId: result.keyId,
          apiKey: result.apiKey,
          message: 'API key created successfully. Store this key securely as it cannot be retrieved again.'
        }
      }, { status: 201 })

    } catch (error) {
      console.error('Create API key error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

// DELETE /api/admin/api-keys - Revoke API key
export async function DELETE(request: NextRequest) {
  return withSecurity(request, {
    adminOnly: true,
    rateLimit: {
      requests: 20,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  }, async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      const keyId = searchParams.get('keyId')
      const reason = searchParams.get('reason')

      if (!keyId) {
        return NextResponse.json(
          { error: 'keyId is required' },
          { status: 400 }
        )
      }

      const result = await apiKeyService.revokeAPIKey(
        keyId,
        'admin', // In production, get from authenticated user
        reason || 'Revoked by admin'
      )

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to revoke API key' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'API key revoked successfully'
      })

    } catch (error) {
      console.error('Revoke API key error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
