#!/usr/bin/env tsx

/**
 * Security Testing Script for Mtaani Subscription System
 * 
 * This script tests various security scenarios to ensure the subscription
 * system properly prevents unauthorized access and enforces tier restrictions.
 */

interface TestResult {
  test: string
  passed: boolean
  message: string
  details?: any
}

class SecurityTester {
  private baseUrl: string
  private results: TestResult[] = []

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  async runAllTests(): Promise<void> {
    console.log('🔒 Starting Security Tests for Mtaani Subscription System\n')

    await this.testInvalidTokenAccess()
    await this.testUnauthorizedFeatureAccess()
    await this.testUsageLimitEnforcement()
    await this.testPlanUpgradeWithoutPayment()
    await this.testBypassAttemptDetection()

    this.printResults()
  }

  private async testInvalidTokenAccess(): Promise<void> {
    console.log('🧪 Testing: Invalid Security Token Access')
    
    try {
      const response = await fetch(`${this.baseUrl}/api/subscription/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '1',
          feature: 'apiAccess',
          securityToken: 'invalid_token_123'
        })
      })

      const result = await response.json()
      
      if (response.status === 401 && result.reason === 'Invalid security token') {
        this.addResult('Invalid Token Access', true, 'Correctly rejected invalid security token')
      } else {
        this.addResult('Invalid Token Access', false, 'Failed to reject invalid security token', result)
      }
    } catch (error) {
      this.addResult('Invalid Token Access', false, 'Test failed with error', error)
    }
  }

  private async testUnauthorizedFeatureAccess(): Promise<void> {
    console.log('🧪 Testing: Unauthorized Feature Access (Starter plan accessing Enterprise features)')
    
    try {
      const response = await fetch(`${this.baseUrl}/api/subscription/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '2', // Assume user 2 has starter plan
          feature: 'apiAccess', // Enterprise feature
          securityToken: 'secure_token_123'
        })
      })

      const result = await response.json()
      
      if (!result.hasAccess && result.reason?.includes('not available')) {
        this.addResult('Unauthorized Feature Access', true, 'Correctly denied access to premium feature')
      } else {
        this.addResult('Unauthorized Feature Access', false, 'Incorrectly allowed access to premium feature', result)
      }
    } catch (error) {
      this.addResult('Unauthorized Feature Access', false, 'Test failed with error', error)
    }
  }

  private async testUsageLimitEnforcement(): Promise<void> {
    console.log('🧪 Testing: Usage Limit Enforcement')
    
    try {
      // Try to exceed photo limit for starter plan (5 photos)
      const response = await fetch(`${this.baseUrl}/api/subscription/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '2', // Starter plan user
          feature: 'photos',
          increment: 10, // Try to add 10 photos (exceeds limit of 5)
          securityToken: 'secure_token_123'
        })
      })

      const result = await response.json()
      
      if (response.status === 402 && result.error === 'Usage limit exceeded') {
        this.addResult('Usage Limit Enforcement', true, 'Correctly enforced usage limits')
      } else {
        this.addResult('Usage Limit Enforcement', false, 'Failed to enforce usage limits', result)
      }
    } catch (error) {
      this.addResult('Usage Limit Enforcement', false, 'Test failed with error', error)
    }
  }

  private async testPlanUpgradeWithoutPayment(): Promise<void> {
    console.log('🧪 Testing: Plan Upgrade Without Payment')
    
    try {
      const response = await fetch(`${this.baseUrl}/api/subscription/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '1',
          newPlan: 'enterprise',
          isAnnual: false,
          securityToken: 'secure_token_123'
          // No paymentMethodId provided
        })
      })

      const result = await response.json()
      
      // Should either require payment method or fail payment processing
      if (response.status === 402 || result.error?.includes('Payment')) {
        this.addResult('Plan Upgrade Without Payment', true, 'Correctly prevented upgrade without payment')
      } else {
        this.addResult('Plan Upgrade Without Payment', false, 'Incorrectly allowed upgrade without payment', result)
      }
    } catch (error) {
      this.addResult('Plan Upgrade Without Payment', false, 'Test failed with error', error)
    }
  }

  private async testBypassAttemptDetection(): Promise<void> {
    console.log('🧪 Testing: Bypass Attempt Detection')
    
    try {
      // Simulate multiple rapid requests with different invalid tokens
      const promises = Array.from({ length: 3 }, (_, i) => 
        fetch(`${this.baseUrl}/api/subscription/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: '1',
            feature: 'apiAccess',
            securityToken: `bypass_attempt_${i}`
          })
        })
      )

      const responses = await Promise.all(promises)
      const results = await Promise.all(responses.map(r => r.json()))
      
      // All should be rejected
      const allRejected = results.every(result => !result.isValid)
      
      if (allRejected) {
        this.addResult('Bypass Attempt Detection', true, 'Successfully detected and blocked bypass attempts')
      } else {
        this.addResult('Bypass Attempt Detection', false, 'Failed to detect bypass attempts', results)
      }
    } catch (error) {
      this.addResult('Bypass Attempt Detection', false, 'Test failed with error', error)
    }
  }

  private addResult(test: string, passed: boolean, message: string, details?: any): void {
    this.results.push({ test, passed, message, details })
    const status = passed ? '✅ PASS' : '❌ FAIL'
    console.log(`   ${status}: ${message}\n`)
  }

  private printResults(): void {
    console.log('📊 Security Test Results Summary')
    console.log('================================\n')

    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length
    const percentage = Math.round((passed / total) * 100)

    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${total - passed}`)
    console.log(`Success Rate: ${percentage}%\n`)

    if (percentage === 100) {
      console.log('🎉 All security tests passed! The subscription system is properly secured.')
    } else if (percentage >= 80) {
      console.log('⚠️  Most security tests passed, but some issues need attention.')
    } else {
      console.log('🚨 Critical security issues detected! Immediate attention required.')
    }

    console.log('\nDetailed Results:')
    console.log('-----------------')
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      console.log(`${status} ${result.test}: ${result.message}`)
      if (!result.passed && result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`)
      }
    })

    console.log('\n🔒 Security testing completed.')
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new SecurityTester()
  tester.runAllTests().catch(console.error)
}

export { SecurityTester }
