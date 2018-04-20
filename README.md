#  ws-stats-server

## Install:

0. Requires node and npm.
1. npm install
2. nohup npm run dev &
3. exit from ssh.

## Real Install:
2. Follow these instructions to [create a service](https://www.terlici.com/2015/06/20/running-node-forever.html)

### Deploy to sites using a single script tag, or the [WordPress plugin](https://github.com/Wier-Stewart/ws-stats)
`<script src="://your-server.com/browser/js/stats.js"></script> `

### Apache2 Proxy Config:

`ProxyPass /browser http://localhost:8000`

### NGINX Proxy Config:
```
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
```

## Testing

http://localhost:8000/test is a very cheap way to send sample, but real pageload data.