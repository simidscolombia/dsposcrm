import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to Server-simids-pos!');
  
  const checkCmd = `grep -rn "public" /var/www/simids-pos/ 2>/dev/null | grep -i "cp"`;

  conn.exec(checkCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      console.log('OUTPUT:\n' + data.toString());
    }).stderr.on('data', (data) => {
      console.error('STDERR: ' + data.toString());
    });
  });
}).connect({
  host: '134.209.115.74',
  port: 22,
  username: 'root',
  password: '*DSPOSIlI2030*'
});
