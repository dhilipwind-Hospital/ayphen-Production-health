import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { DepartmentController } from '../controllers/department.controller';

/**
 * Test the departments API directly to see what happens
 */
async function testDepartmentsApi() {
  try {
    await AppDataSource.initialize();
    console.log('🧪 Testing Departments API...');

    // Mock request object for Newarun organization
    const mockReq = {
      tenant: {
        id: 'd5b36718-9c30-4d3f-b281-f2153ac6a43d',
        name: 'newarun',
        subdomain: 'newarun'
      },
      query: {
        page: '1',
        limit: '200'
      }
    } as any;

    // Mock response object
    let responseData: any = null;
    let statusCode: number = 200;
    
    const mockRes = {
      json: (data: any) => {
        responseData = data;
        console.log('✅ API Response:', JSON.stringify(data, null, 2));
      },
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      }
    } as any;

    console.log('\n🔍 Test 1: With Newarun tenant context');
    console.log(`   Tenant ID: ${mockReq.tenant.id}`);
    
    await DepartmentController.listAll(mockReq, mockRes);
    
    console.log(`   Status: ${statusCode}`);
    console.log(`   Data count: ${responseData?.data?.length || 0}`);

    // Test 2: Without tenant context (what might be happening)
    console.log('\n🔍 Test 2: Without tenant context (simulating the bug)');
    
    const mockReqNoTenant = {
      tenant: null, // No tenant context
      query: {
        page: '1',
        limit: '200'
      }
    } as any;

    responseData = null;
    statusCode = 200;

    await DepartmentController.listAll(mockReqNoTenant, mockRes);
    
    console.log(`   Status: ${statusCode}`);
    console.log(`   Data count: ${responseData?.data?.length || 0}`);
    
    if (responseData?.data?.length > 0) {
      console.log('   ❌ BUG CONFIRMED: API returns data without tenant context!');
      console.log(`   Sample departments: ${responseData.data.slice(0, 3).map((d: any) => d.name).join(', ')}`);
    } else {
      console.log('   ✅ API correctly returns empty when no tenant');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run test
testDepartmentsApi();
