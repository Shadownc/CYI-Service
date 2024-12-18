<template>
  <n-upload
    multiple
    directory-dnd
    name="images"
    accept="image/*"
    :custom-request="customRequest"
    :show-file-list="false"
    :file-list="fileList"
    :on-update:file-list="updateFileList"
    :max="7"
    :disabled="isDisabled"
    ref="uploadRef"
  >
    <n-spin :show="spinShow">
      <n-upload-dragger style="height: 270px" @paste="handlePaste">
        <n-flex
          vertical
          justify="center"
          align="center"
          style="width: 100%; height: 100%"
        >
          <div style="margin-bottom: 12px">
            <n-icon size="48" :depth="3">
              <CloudUploadAlt />
            </n-icon>
          </div>
          <n-text style="font-size: 16px"> 点击上传或将图片拖拽到此处 </n-text>
          <n-p depth="3" style="margin: 8px 0 0 0">图片限制最大10M </n-p>
        </n-flex>
      </n-upload-dragger>
    </n-spin>
  </n-upload>
</template>

<script setup>
import { CloudUploadAlt } from "@vicons/fa";
import { upload } from "@/api";
import { compressImage } from "@/utils/imageCompression";

const uploadRef = ref(null);
const spinShow = ref(false);
const fileList = ref([]);
const totalFiles = ref(0);
const finishedFiles = ref(0);
const uploadResults = ref([]);
const isDisabled = ref(false);
const emit = defineEmits(["uploaded"]);

// 已上传图片的信息
const uploadedImage = ref(null);
const htmlText = ref("");
const markdownText = ref("");

const updateFileList = (newFileList) => {
  fileList.value = newFileList;
  totalFiles.value = newFileList.length;
  // 重置已完成的文件数和上传结果
  finishedFiles.value = 0;
  uploadResults.value = [];
};

const customRequest = async (options) => {
  spinShow.value = true;
  isDisabled.value = true;
  const { file } = options;
  const maxSize = 10 * 1024 * 1024; // 10MB
  let uploadFile = file.file; // 要上传的文件

  if (file.file.size > maxSize) {
    try {
      // 压缩图片
      uploadFile = await compressImage(file.file, maxSize);
      console.log("图片已压缩:", uploadFile);
    } catch (error) {
      console.error("压缩图片出错:", error);
      handleError(file);
      spinShow.value = false;
      isDisabled.value = false;
      return;
    }
  }

  const formData = new FormData();
  formData.append("images", uploadFile, file.file.name); // 使用原始文件名

  try {
    const response = await upload(formData);
    const { uploaded, failed } = response;
    if (failed.length) {
      for (let i = 0; i < failed.length; i++) {
        $message.error(
          `${failed[i].filename}上传失败，原因：${failed[i].reason}`,
          { duration: 5000 }
        );
      }
    }
    uploadResults.value.push(...uploaded);
  } catch (error) {
    handleError(file);
  } finally {
    finishedFiles.value++;
    console.log(
      "finishedFiles:",
      finishedFiles.value,
      "totalFiles:",
      totalFiles.value
    );
    if (finishedFiles.value === totalFiles.value) {
      spinShow.value = false;
      isDisabled.value = false;
      uploadRef.value.clear();
      fileList.value = []; // 清空文件列表 不清空会导致下一次上传带上之前已经成功上传的
      emit("uploaded", uploadResults.value);
    }
  }
};

// 处理上传错误
const handleError = (file) => {
  $message.error(`${file.name}上传失败,请重试`, { duration: 5000 });
};

// 处理粘贴上传
const handlePaste = async (event) => {
  event.preventDefault(); // 阻止默认行为
  fileList.value = []; // 重置fileList
  const items = event.clipboardData.items;
  
  const newFiles = []; // 新的文件列表
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const blob = items[i].getAsFile();
      const file = new File([blob], `pasted-image-${Date.now() + i}.png`, {
        type: blob.type,
      });
      const uploadFile = {
        id: `${Date.now()}_${i}`, // 生成唯一的 ID
        name: file.name,
        status: "pending",
        percentage: 0,
        file: file,
        url: "",
        type: file.type,
      };
      newFiles.push(uploadFile); // 将文件添加到 newFiles 列表中
    }
  }

  // 更新 fileList 并批量上传
  fileList.value.push(...newFiles); // 批量加入 fileList
  updateFileList(fileList.value); // 更新 fileList，确保触发更新

  // 批量触发上传
  for (let i = 0; i < newFiles.length; i++) {
    customRequest({ file: newFiles[i] }); // 并行处理每个文件的上传
  }
};
</script>
<style lang="css" scoped>
:deep(.n-upload-trigger) {
  width: 100% !important;
}
</style>