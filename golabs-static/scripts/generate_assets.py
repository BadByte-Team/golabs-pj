#!/usr/bin/env python3
"""
Generate CTF challenge assets:
  - PCAP file with HTTP traffic containing a flag
  - ZIP file with realistic logs containing a flag
  - JPEG image with EXIF metadata containing a flag
"""

import struct
import zipfile
import random
import os
import io
from datetime import datetime, timedelta
from PIL import Image
import piexif

OUTPUT_DIR = '/output'
INPUT_DIR = '/input'

# ── FLAGS ──
FLAG_PCAP = 'CTF{sn1ff3d_th3_p4ck3ts_l1k3_4_pr0}'
FLAG_LOGS = 'CTF{l0g_f1l3s_t3ll_s3cr3ts}'
FLAG_EXIF = 'CTF{3x1f_d4t4_h1dd3n_1n_pl41n_s1ght}'


def ip_to_bytes(ip: str) -> bytes:
    return bytes(int(x) for x in ip.split('.'))


def make_packet(src_mac, dst_mac, src_ip, dst_ip, src_port, dst_port, payload, seq=1, ack=1, flags=0x18):
    """Build a raw Ethernet + IPv4 + TCP packet."""
    payload_bytes = payload.encode() if isinstance(payload, str) else payload

    # Ethernet header (14 bytes)
    eth = struct.pack('!6s6sH',
        bytes.fromhex(dst_mac.replace(':', '')),
        bytes.fromhex(src_mac.replace(':', '')),
        0x0800
    )

    tcp_hdr_len = 20
    ip_total_len = 20 + tcp_hdr_len + len(payload_bytes)

    # IPv4 header (20 bytes)
    ip = struct.pack('!BBHHHBBH4s4s',
        0x45, 0, ip_total_len,
        random.randint(1000, 60000), 0x4000,
        64, 6, 0,
        ip_to_bytes(src_ip),
        ip_to_bytes(dst_ip)
    )

    # TCP header (20 bytes)
    tcp = struct.pack('!HHIIBBHHH',
        src_port, dst_port,
        seq, ack,
        (tcp_hdr_len // 4) << 4,
        flags, 65535, 0, 0
    )

    return eth + ip + tcp + payload_bytes


def generate_pcap():
    """Create a PCAP with HTTP traffic; flag hidden in a JSON response."""
    print('[*] Generating PCAP...')

    global_header = struct.pack('<IHHiIII',
        0xa1b2c3d4, 2, 4, 0, 0, 65535, 1
    )

    client_mac = 'aa:bb:cc:dd:ee:01'
    server_mac = 'aa:bb:cc:dd:ee:02'
    client_ip = '192.168.1.105'
    server_ip = '10.0.0.50'

    base_ts = int(datetime(2026, 5, 15, 14, 23, 11).timestamp())

    packets = [
        # 1. GET /
        make_packet(client_mac, server_mac, client_ip, server_ip, 49152, 80,
            'GET / HTTP/1.1\r\nHost: internal.novacipherlabs.com\r\nUser-Agent: Mozilla/5.0\r\nAccept: text/html\r\n\r\n'),
        # 2. 200 OK (HTML)
        make_packet(server_mac, client_mac, server_ip, client_ip, 80, 49152,
            'HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nServer: nginx/1.21.0\r\n\r\n<html><body><h1>NovaCipher Internal</h1></body></html>'),
        # 3. GET /assets/logo.png
        make_packet(client_mac, server_mac, client_ip, server_ip, 49153, 80,
            'GET /assets/logo.png HTTP/1.1\r\nHost: internal.novacipherlabs.com\r\nAccept: image/*\r\n\r\n'),
        # 4. 304 Not Modified
        make_packet(server_mac, client_mac, server_ip, client_ip, 80, 49153,
            'HTTP/1.1 304 Not Modified\r\nETag: "5f3c8a"\r\n\r\n'),
        # 5. GET /api/health
        make_packet(client_mac, server_mac, client_ip, server_ip, 49154, 80,
            'GET /api/health HTTP/1.1\r\nHost: internal.novacipherlabs.com\r\nAccept: application/json\r\n\r\n'),
        # 6. 200 OK (JSON with flag)
        make_packet(server_mac, client_mac, server_ip, client_ip, 80, 49154,
            f'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nServer: nginx/1.21.0\r\n\r\n'
            f'{{"status":"ok","version":"2.4.1","debug_token":"{FLAG_PCAP}","uptime":98432}}'),
        # 7. GET /styles.css (noise)
        make_packet(client_mac, server_mac, client_ip, server_ip, 49155, 80,
            'GET /styles.css HTTP/1.1\r\nHost: internal.novacipherlabs.com\r\nAccept: text/css\r\n\r\n'),
        # 8. 200 OK (CSS)
        make_packet(server_mac, client_mac, server_ip, client_ip, 80, 49155,
            'HTTP/1.1 200 OK\r\nContent-Type: text/css\r\n\r\nbody{margin:0;font-family:sans-serif}'),
    ]

    pcap_path = os.path.join(OUTPUT_DIR, 'sample_capture.pcap')
    with open(pcap_path, 'wb') as f:
        f.write(global_header)
        for i, pkt in enumerate(packets):
            ts_sec = base_ts + i
            ts_usec = random.randint(0, 999999)
            f.write(struct.pack('<IIII', ts_sec, ts_usec, len(pkt), len(pkt)))
            f.write(pkt)

    print(f'    -> {pcap_path} ({os.path.getsize(pcap_path)} bytes)')


def generate_logs_zip():
    """Create a ZIP with realistic log files; flag hidden in auth.log."""
    print('[*] Generating logs ZIP...')

    random.seed(42)
    ips = ['192.168.1.45', '10.0.0.12', '172.16.0.88', '192.168.1.105', '10.0.0.200', '192.168.1.78']
    base = datetime(2026, 5, 15, 6, 0, 0)

    # ── access.log ──
    paths = ['/', '/api/status', '/login', '/dashboard', '/assets/style.css',
             '/assets/app.js', '/favicon.ico', '/api/users', '/health', '/about']
    statuses = [200, 200, 200, 301, 304, 404, 200, 200, 200, 200]
    access_lines = []
    for _ in range(180):
        t = base + timedelta(minutes=random.randint(0, 720), seconds=random.randint(0, 59))
        access_lines.append(
            f'{random.choice(ips)} - - [{t:%d/%b/%Y:%H:%M:%S} +0000] '
            f'"GET {random.choice(paths)} HTTP/1.1" {random.choice(statuses)} '
            f'{random.randint(200, 18000)} "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"'
        )

    # ── auth.log ──
    users = ['admin', 'jdoe', 'mgarcia', 'sysop', 'backup', 'deploy', 'root']
    auth_lines = []
    for _ in range(220):
        t = base + timedelta(minutes=random.randint(0, 1080), seconds=random.randint(0, 59))
        pid = random.randint(1000, 9999)
        port = random.randint(40000, 65000)
        user = random.choice(users)
        ip = random.choice(ips)
        r = random.random()
        if r < 0.5:
            auth_lines.append(f'{t:%b %d %H:%M:%S} nova-srv sshd[{pid}]: Accepted publickey for {user} from {ip} port {port} ssh2')
        elif r < 0.75:
            auth_lines.append(f'{t:%b %d %H:%M:%S} nova-srv sshd[{pid}]: Failed password for {user} from {ip} port {port} ssh2')
        elif r < 0.9:
            auth_lines.append(f'{t:%b %d %H:%M:%S} nova-srv sudo: {user} : TTY=pts/{random.randint(0,5)} ; PWD=/home/{user} ; USER=root ; COMMAND=/usr/bin/apt update')
        else:
            auth_lines.append(f'{t:%b %d %H:%M:%S} nova-srv sshd[{pid}]: Connection closed by {ip} port {port} [preauth]')

    # Insert flag in a realistic-looking line
    ft = base + timedelta(minutes=random.randint(300, 600))
    auth_lines.insert(random.randint(90, 140),
        f'{ft:%b %d %H:%M:%S} nova-srv sshd[4847]: Failed password for user flag_token={FLAG_LOGS} from 203.0.113.42 port 22 ssh2'
    )

    # ── system.log ──
    services = ['systemd', 'networkd', 'cron', 'dockerd', 'nginx', 'kernel', 'sshd']
    messages = [
        'Started Daily apt download activities.',
        'Reloading configuration.',
        'Connection from 10.0.0.1 accepted.',
        'Process exited with status 0.',
        'Rotating log files.',
        'Health check passed.',
        'Memory usage within threshold.',
        'Disk usage: /dev/sda1 62%.',
        'Finished System Logging Service.',
        'Starting cleanup of temporary directories...',
    ]
    sys_lines = []
    for _ in range(120):
        t = base + timedelta(minutes=random.randint(0, 1080), seconds=random.randint(0, 59))
        sys_lines.append(
            f'{t:%b %d %H:%M:%S} nova-srv {random.choice(services)}[{random.randint(100,9999)}]: {random.choice(messages)}'
        )

    zip_path = os.path.join(OUTPUT_DIR, 'incident_logs.zip')
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('logs/access.log', '\n'.join(access_lines))
        zf.writestr('logs/auth.log', '\n'.join(auth_lines))
        zf.writestr('logs/system.log', '\n'.join(sys_lines))
        zf.writestr('logs/README.txt', (
            'NovaCipher Labs — Incident #NC-2026-0419\n'
            'Sanitized server logs for training purposes.\n\n'
            'Files:\n'
            '  access.log  — Nginx access log\n'
            '  auth.log    — System authentication log\n'
            '  system.log  — General system log\n'
        ))

    print(f'    -> {zip_path} ({os.path.getsize(zip_path)} bytes)')


def inject_exif():
    """Convert source image to JPEG and inject EXIF metadata with flag."""
    print('[*] Injecting EXIF data into team image...')

    src = os.path.join(INPUT_DIR, 'team_lead_original.png')
    dst = os.path.join(OUTPUT_DIR, 'team_lead.jpg')

    # Open and convert to JPEG
    img = Image.open(src).convert('RGB')
    img = img.resize((600, 600), Image.LANCZOS)

    # Build EXIF
    exif_dict = {
        '0th': {
            piexif.ImageIFD.ImageDescription: FLAG_EXIF.encode(),
            piexif.ImageIFD.Make: b'Canon',
            piexif.ImageIFD.Model: b'EOS R5',
            piexif.ImageIFD.Software: b'Adobe Photoshop 2026',
            piexif.ImageIFD.Artist: b'NovaCipher Labs Media Team',
            piexif.ImageIFD.Copyright: b'2026 NovaCipher Labs, All Rights Reserved',
        },
        'Exif': {
            piexif.ExifIFD.DateTimeOriginal: b'2026:03:15 09:30:00',
            piexif.ExifIFD.LensMake: b'Canon',
            piexif.ExifIFD.LensModel: b'RF 50mm F1.2L USM',
            piexif.ExifIFD.FocalLength: (50, 1),
            piexif.ExifIFD.ISOSpeedRatings: 200,
        },
        '1st': {},
        'GPS': {},
    }

    exif_bytes = piexif.dump(exif_dict)

    # Save as JPEG with EXIF
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=92)
    buf.seek(0)

    with open(dst, 'wb') as f:
        f.write(buf.read())

    piexif.insert(exif_bytes, dst)
    print(f'    -> {dst} ({os.path.getsize(dst)} bytes)')


if __name__ == '__main__':
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    generate_pcap()
    generate_logs_zip()
    inject_exif()

    print('\n[+] All challenge assets generated successfully!')
