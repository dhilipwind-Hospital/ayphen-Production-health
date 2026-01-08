const { chromium } = require('playwright');

(async () => {
  console.log('🏥 Testing Department/Service Deactivation Impact on Public Pages');
  console.log('================================================================');
  
  const browser = await chromium.launch({ headless: false });
  
  try {
    // Step 1: Check current public departments page
    console.log('📍 Step 1: Checking Current Public Departments Page');
    const publicPage = await browser.newPage();
    
    await publicPage.goto('http://localhost:3000/departments');
    await publicPage.waitForLoadState('networkidle');
    await publicPage.waitForTimeout(3000);
    
    // Take screenshot of current departments
    await publicPage.screenshot({ path: 'public-departments-before.png' });
    console.log('✅ Screenshot saved: public-departments-before.png');
    
    // Count departments
    const departmentCards = await publicPage.locator('.ant-card').count();
    console.log(`📊 Current departments showing: ${departmentCards}`);
    
    // Check if any show "Inactive" status
    const pageContent = await publicPage.content();
    const hasInactiveTag = pageContent.includes('Inactive');
    const hasActiveTag = pageContent.includes('Active');
    
    console.log(`✅ Has "Active" tags: ${hasActiveTag}`);
    console.log(`⚠️  Has "Inactive" tags: ${hasInactiveTag}`);
    
    await publicPage.close();
    
    // Step 2: Login as admin and deactivate a department
    console.log('\n📍 Step 2: Admin Login and Department Deactivation');
    const adminPage = await browser.newPage();
    
    await adminPage.goto('http://localhost:3000/login');
    await adminPage.waitForLoadState('networkidle');
    
    await adminPage.fill('[data-testid="login-email-input"]', 'admin@hospital.com');
    await adminPage.fill('[data-testid="login-password-input"]', 'Admin@2025');
    await adminPage.click('[data-testid="login-submit-button"]');
    
    await adminPage.waitForTimeout(3000);
    console.log(`✅ Admin logged in: ${adminPage.url()}`);
    
    // Navigate to departments admin
    await adminPage.goto('http://localhost:3000/admin/departments');
    await adminPage.waitForTimeout(3000);
    
    // Take screenshot of admin departments
    await adminPage.screenshot({ path: 'admin-departments-before.png' });
    console.log('✅ Screenshot saved: admin-departments-before.png');
    
    // Look for a department to deactivate (try Cardiology first)
    const deactivateButtons = adminPage.locator('button:has-text("Deactivate")');
    const deactivateCount = await deactivateButtons.count();
    
    console.log(`📊 Departments available to deactivate: ${deactivateCount}`);
    
    if (deactivateCount > 0) {
      // Click first deactivate button
      await deactivateButtons.first().click();
      await adminPage.waitForTimeout(2000);
      
      console.log('✅ Deactivated a department');
      
      // Take screenshot after deactivation
      await adminPage.screenshot({ path: 'admin-departments-after.png' });
      console.log('✅ Screenshot saved: admin-departments-after.png');
    } else {
      console.log('⚠️  No departments available to deactivate');
    }
    
    await adminPage.close();
    
    // Step 3: Check public departments page again
    console.log('\n📍 Step 3: Checking Public Departments After Deactivation');
    const publicPage2 = await browser.newPage();
    
    await publicPage2.goto('http://localhost:3000/departments');
    await publicPage2.waitForLoadState('networkidle');
    await publicPage2.waitForTimeout(3000);
    
    // Take screenshot after deactivation
    await publicPage2.screenshot({ path: 'public-departments-after.png' });
    console.log('✅ Screenshot saved: public-departments-after.png');
    
    // Count departments again
    const departmentCardsAfter = await publicPage2.locator('.ant-card').count();
    console.log(`📊 Departments showing after deactivation: ${departmentCardsAfter}`);
    
    // Check content again
    const pageContentAfter = await publicPage2.content();
    const hasInactiveTagAfter = pageContentAfter.includes('Inactive');
    const hasActiveTagAfter = pageContentAfter.includes('Active');
    
    console.log(`✅ Has "Active" tags: ${hasActiveTagAfter}`);
    console.log(`⚠️  Has "Inactive" tags: ${hasInactiveTagAfter}`);
    
    await publicPage2.close();
    
    // Step 4: Check services page
    console.log('\n📍 Step 4: Checking Public Services Page');
    const servicesPage = await browser.newPage();
    
    await servicesPage.goto('http://localhost:3000/services');
    await servicesPage.waitForLoadState('networkidle');
    await servicesPage.waitForTimeout(3000);
    
    // Take screenshot of services
    await servicesPage.screenshot({ path: 'public-services.png' });
    console.log('✅ Screenshot saved: public-services.png');
    
    // Check services content
    const servicesContent = await servicesPage.content();
    const servicesHasInactive = servicesContent.includes('inactive') || servicesContent.includes('Inactive');
    const servicesCount = await servicesPage.locator('.ant-card').count();
    
    console.log(`📊 Services showing: ${servicesCount}`);
    console.log(`⚠️  Services has "Inactive": ${servicesHasInactive}`);
    
    await servicesPage.close();
    
    // FINAL ANALYSIS
    console.log('\n🎯 DEACTIVATION IMPACT ANALYSIS:');
    console.log('================================');
    
    const departmentCountChanged = departmentCards !== departmentCardsAfter;
    const inactiveNowShowing = hasInactiveTagAfter && !hasInactiveTag;
    
    console.log(`📊 Department count changed: ${departmentCountChanged} (${departmentCards} → ${departmentCardsAfter})`);
    console.log(`⚠️  Inactive departments now showing: ${inactiveNowShowing}`);
    
    if (!departmentCountChanged && !inactiveNowShowing) {
      console.log('\n❌ PROBLEM IDENTIFIED:');
      console.log('🔍 Deactivated departments still appear on public homepage');
      console.log('🔍 Public pages do not filter by active status');
      console.log('🔍 Users can see inactive departments/services');
      
      console.log('\n💡 SOLUTION NEEDED:');
      console.log('✅ Filter departments by status="active" in public pages');
      console.log('✅ Filter services by status="active" in public pages');
      console.log('✅ Hide inactive departments from public view');
      
    } else if (inactiveNowShowing) {
      console.log('\n⚠️  PARTIAL ISSUE:');
      console.log('✅ Inactive departments are marked as "Inactive"');
      console.log('❌ But they still appear on public pages');
      console.log('💡 Should hide inactive departments completely');
      
    } else {
      console.log('\n🎉 WORKING CORRECTLY:');
      console.log('✅ Deactivated departments are hidden from public view');
      console.log('✅ Only active departments appear on homepage');
    }
    
    console.log('\n📋 CURRENT BEHAVIOR:');
    console.log(`   Public Departments: ${departmentCardsAfter} showing`);
    console.log(`   Public Services: ${servicesCount} showing`);
    console.log(`   Inactive Tags Visible: ${hasInactiveTagAfter}`);
    
  } catch (error) {
    console.error('❌ Department deactivation test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n🏁 Department deactivation impact test completed');
  }
})();
