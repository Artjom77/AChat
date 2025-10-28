#!/usr/bin/env python3
"""Generate PNG icons from text/emoji for PWA"""

def create_png_icon(size, filename):
    """Create a simple PNG icon with gradient background and emoji"""
    # Create a simple PNG header and data
    # For simplicity, we'll create a basic image

    # Since we don't have PIL, let's create a minimal valid PNG
    # with a colored square (simplified approach)

    import struct
    import zlib

    width, height = size, size

    def png_pack(png_tag, data):
        chunk_head = png_tag + data
        return struct.pack("!I", len(data)) + chunk_head + struct.pack("!I", 0xFFFFFFFF & zlib.crc32(chunk_head))

    # PNG header
    png_header = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk
    ihdr_data = struct.pack("!2I5B", width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    ihdr = png_pack(b'IHDR', ihdr_data)

    # Create gradient image data (simple purple/blue gradient)
    img_data = b''
    for y in range(height):
        img_data += b'\x00'  # Filter type
        for x in range(width):
            # Create gradient from #667eea to #764ba2
            r1, g1, b1 = 0x66, 0x7e, 0xea
            r2, g2, b2 = 0x76, 0x4b, 0xa2

            ratio = y / height
            r = int(r1 + (r2 - r1) * ratio)
            g = int(g1 + (g2 - g1) * ratio)
            b = int(b1 + (b2 - b1) * ratio)

            # Add white circle in center for lock icon effect
            dx = x - width // 2
            dy = y - height // 2
            dist = (dx*dx + dy*dy) ** 0.5
            if dist < width * 0.3:
                blend = (width * 0.3 - dist) / (width * 0.3)
                r = int(r + (255 - r) * blend * 0.8)
                g = int(g + (255 - g) * blend * 0.8)
                b = int(b + (255 - b) * blend * 0.8)

            img_data += bytes([r, g, b])

    # IDAT chunk (compressed image data)
    idat = png_pack(b'IDAT', zlib.compress(img_data, 9))

    # IEND chunk
    iend = png_pack(b'IEND', b'')

    # Write PNG file
    with open(filename, 'wb') as f:
        f.write(png_header + ihdr + idat + iend)

    print(f"Created {filename} ({size}x{size})")

if __name__ == "__main__":
    create_png_icon(192, 'icon-192.png')
    create_png_icon(512, 'icon-512.png')
    print("Icons generated successfully!")
