import readline from 'readline';
import { execSync } from 'child_process';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = prompt => {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
};

const main = async () => {
  try {
    console.log('设置管理页面访问密码');
    console.log('=======================');

    const password = await question('请输入密码: ');

    if (!password || password.length < 6) {
      console.error('错误: 密码长度至少为 6 位');
      rl.close();
      process.exit(1);
    }

    const confirmPassword = await question('请再次输入密码: ');

    if (password !== confirmPassword) {
      console.error('错误: 两次输入的密码不一致');
      rl.close();
      process.exit(1);
    }

    console.log('\n正在设置密码...');

    const command = `wrangler kv key put --binding=SITE_DATA "admin_password" "${password}" --config cloudflare/wrangler.toml --remote --preview false`;

    execSync(command, { stdio: 'inherit' });

    console.log('\n密码设置成功!');
  } catch (error) {
    console.error('设置密码失败:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
};

main();
