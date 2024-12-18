<template>
  <CommonPage>
    <MeCrud
      ref="$table"
      v-model:query-items="queryItems"
      :scroll-x="1200"
      :columns="columns"
      :get-data="api.read"
      @onChecked="onChecked"
    >
      <MeQueryItem label="用户名" :label-width="50">
        <n-input
          v-model:value="queryItems.username"
          type="text"
          placeholder="请输入用户名"
          clearable
        />
      </MeQueryItem>
      <MeQueryItem label="邮箱" :label-width="50">
        <n-input
          v-model:value="queryItems.email"
          type="text"
          placeholder="请输入邮箱"
          clearable
        />
      </MeQueryItem>
      <MeQueryItem label="游客上传" :label-width="60">
        <n-select
          v-model:value="queryItems.isPublic"
          clearable
          :options="[
            { label: '是', value: 1 },
            { label: '否', value: 0 },
          ]"
        />
      </MeQueryItem>
      <template #delete>
        <n-button type="error" @click="handleMultipleDelete">删除</n-button>
      </template>
    </MeCrud>
    <ModalInfo v-model:show="showModal" :fileInfo="fileInfo" />
  </CommonPage>
</template>
  
<script setup>
import { MeCrud, MeQueryItem } from "@/components";
import { useCrud } from "@/composables";
import { formatDateTime } from "@/utils";
import { NAvatar, NButton, NImage } from "naive-ui";
import api from "./api";
import ModalInfo from "@/components/front/ModalInfo.vue";
import { useModal } from "@/hooks/useModal";

const { showModal, fileInfo, openModal } = useModal();

defineOptions({ name: "fileImgMgt" });

const $table = ref(null);
/** QueryBar筛选参数（可选） */
const queryItems = ref({});

onMounted(() => {
  $table.value?.handleSearch();
});

const {} = useCrud({
  name: "图片",
  initForm: { enable: true },
  doDelete: api.delete,
  refresh: () => $table.value?.handleSearch(),
});

const imageIds = ref([]);

const onChecked = (v) => {
  imageIds.value = v;
};
const handleMultipleDelete = () => {
  if (!imageIds.value.length) {
    $message.error("请先选择要删除的数据");
    return;
  }
  handleDelete(imageIds.value);
};

const handleDelete = async (data) => {
  const d = $dialog.warning({
    content: "确定删除？",
    title: "提示",
    positiveText: "确定",
    negativeText: "取消",
    async onPositiveClick() {
      try {
        d.loading = true;
        data = Array.isArray(data) ? data : [data];
        const res = await api.delete({ imageIds: data });
        $message.success("删除成功");
        d.loading = false;
        $table.value?.handleSearch();
      } catch (error) {
        console.error(error);
        d.loading = false;
      }
    },
  });
};

const handleView = (file) => {
  openModal(file);
};

const columns = [
  {
    type: "selection",
  },
  {
    title: "小图",
    key: "id",
    align: "center",
    width: 80,
    render: ({ url }) =>
      h(NImage, {
        width: "50",
        src: url,
      }),
  },
  {
    title: "用户名",
    key: "username",
    align: "center",
    width: 80,
    ellipsis: { tooltip: true },
    render: ({ user }) => {
      return h("span", user.username ?? "游客");
    },
  },
  {
    title: "邮箱",
    key: "email",
    align: "center",
    width: 80,
    ellipsis: { tooltip: true },
    render: ({ user }) => {
      return h("span", user.email ?? "公共图片");
    },
  },
  {
    title: "URL",
    key: "url",
    align: "center",
    width: 200,
    ellipsis: { tooltip: true },
  },
  {
    title: "文件名",
    key: "filename",
    align: "center",
    width: 150,
    ellipsis: { tooltip: true },
  },
  {
    title: "上传时间",
    key: "upload_data",
    align: "center",
    width: 180,
    render(row) {
      return h("span", formatDateTime(row.upload_data));
    },
  },
  {
    title: "操作",
    key: "actions",
    align: "center",
    width: 320,
    fixed: "right",
    hideInExcel: true,
    render(row) {
      return [
        h(
          NButton,
          {
            size: "small",
            type: "primary",
            style: "margin-left: 12px;",
            onClick: () => handleView(row),
          },
          {
            default: () => "查看",
            icon: () => h("i", { class: "i-mdi-eye text-14" }),
          }
        ),

        h(
          NButton,
          {
            size: "small",
            type: "error",
            style: "margin-left: 12px;",
            onClick: () => handleDelete(row.id),
          },
          {
            default: () => "删除",
            icon: () =>
              h("i", { class: "i-material-symbols:delete-outline text-14" }),
          }
        ),
      ];
    },
  },
];
</script>
  