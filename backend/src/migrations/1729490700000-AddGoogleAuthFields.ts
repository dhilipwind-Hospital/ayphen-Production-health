import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGoogleAuthFields1729490700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Adding Google OAuth fields to users table...');

    // Add googleId column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'google_id',
        type: 'varchar',
        isNullable: true,
      })
    );
    console.log('✅ Added google_id column');

    // Add profilePicture column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'profile_picture',
        type: 'varchar',
        isNullable: true,
      })
    );
    console.log('✅ Added profile_picture column');

    // Make password nullable for Google OAuth users
    await queryRunner.changeColumn(
      'users',
      'password',
      new TableColumn({
        name: 'password',
        type: 'varchar',
        isNullable: true,
      })
    );
    console.log('✅ Made password nullable for Google OAuth users');

    console.log('');
    console.log('🎉 Google OAuth fields migration completed!');
    console.log('   - Users can now sign in with Google');
    console.log('   - Profile pictures supported');
    console.log('   - Password is optional for OAuth users');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⚠️  Rolling back Google OAuth fields...');

    // Remove googleId column
    await queryRunner.dropColumn('users', 'google_id');
    console.log('✅ Removed google_id column');

    // Remove profilePicture column
    await queryRunner.dropColumn('users', 'profile_picture');
    console.log('✅ Removed profile_picture column');

    // Make password required again
    await queryRunner.changeColumn(
      'users',
      'password',
      new TableColumn({
        name: 'password',
        type: 'varchar',
        isNullable: false,
      })
    );
    console.log('✅ Made password required again');

    console.log('✅ Google OAuth fields rollback completed');
  }
}
