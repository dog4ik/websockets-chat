use axum::body::Bytes;

fn is_valid_img(bytes: &Bytes) -> bool {
    if bytes.len() < 8 {
        return false;
    };
    if bytes.starts_with(b"\xFF\xD8") {
        // JPEG image
        true
    } else if bytes.starts_with(b"\x89\x50\x4E\x47\x0D\x0A\x1A\x0A") {
        // PNG image
        true
    } else if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
        // GIF image
        true
    } else if bytes.starts_with(b"\x49\x49\x2A\x00") || bytes.starts_with(b"\x4D\x4D\x00\x2A") {
        // TIFF image
        true
    } else {
        false
    }
}
#[derive(Debug)]
pub struct Image {
    pub id: String,
    pub bytes: Bytes,
}

impl Image {
    pub fn new(bytes: Bytes) -> Result<Image, anyhow::Error> {
        if is_valid_img(&bytes) {
            let uuid = uuid::Uuid::new_v4();
            Ok(Image {
                bytes,
                id: uuid.to_string(),
            })
        } else {
            Err(anyhow::anyhow!("bytes are not image"))
        }
    }
}
