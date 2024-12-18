export function compressImage(file, maxSize) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
  
      reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
  
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
  
          // 设置需要的宽度和高度（可根据需要调整）
          let width = img.width;
          let height = img.height;
  
          // 这里可以根据需要调整图片尺寸
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
  
          // 压缩图片，降低质量
          let quality = 0.9; // 初始质量为 90%
          let dataURL = canvas.toDataURL(file.type, quality);
  
          // 循环降低质量，直到文件大小小于 maxSize 或质量过低
          while (dataURL.length > maxSize && quality > 0.1) {
            quality -= 0.1;
            dataURL = canvas.toDataURL(file.type, quality);
          }
  
          // 将 dataURL 转换回 File 对象
          const blob = dataURLtoBlob(dataURL);
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        };
  
        img.onerror = function(error) {
          reject(error);
        };
      };
  
      reader.onerror = function(error) {
        reject(error);
      };
    });
  }
  
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }
  