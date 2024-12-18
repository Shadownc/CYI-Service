<template>
  <div>
    <n-layout class="public-wrap" position="absolute" :native-scrollbar="false">
      <n-infinite-scroll :distance="10" @load="handleLoad">
        <!-- <div class="waterfall">
        <img v-for="(image, index) in images" :key="index" :src="image" class="waterfall-image" />
      </div> -->
        <Waterfall
          class="c-water"
          :list="images"
          :width="320"
          :gutter="7"
          backgroundColor="transparent"
          :lazyload="true"
          :loadProps="{
            loading: 'https://img.loliapi.cn/i/pc/img52.webp',
            error: 'https://img.loliapi.cn/i/pc/img611.webp',
          }"
        >
          <template #default="{ item }">
            <div class="card">
              <LazyImg :url="item.url" @click="openModal(item)" />
              <!-- <p class="text">这是具体内容</p> -->
            </div>
          </template>
        </Waterfall>
        <n-flex justify="center" v-if="loading">
          <n-spin size="small" description="加载中..." />
        </n-flex>
        <div v-if="noMore" class="text">⭐没有更多了⭐</div>
      </n-infinite-scroll>
    </n-layout>
    <ModalInfo v-model:show="showModal" :fileInfo="fileInfo" />
  </div>
</template>

<script setup>
import { LazyImg, Waterfall } from "vue-waterfall-plugin-next";
import "vue-waterfall-plugin-next/dist/style.css";
import { useModal } from "@/hooks/useModal";
import { getPublciImg } from "@/api";
const images = ref([
  // { url: "https://img.loliapi.cn/i/pc/img52.webp", filename: "11" },
  // { url: "https://img.loliapi.cn/i/pc/img62.webp", filename: "22" },
  // { url: "https://img.loliapi.cn/i/pc/img71.webp", filename: "33" },
  // { url: "https://img.loliapi.cn/i/pe/img1279.webp", filename: "44" },
  // { url: "https://img.loliapi.cn/i/pc/img77.webp", filename: "55" },
  // { url: "https://img.loliapi.cn/i/pc/img67.webp", filename: "66" },
  // { url: "https://img.loliapi.cn/i/pe/img1259.webp", filename: "77" },
]);

const { showModal, fileInfo, openModal } = useModal();

const pageNo = ref(1);
const pageSize = ref(15);
const getList = async (page) => {
  loading.value = true;
  const res = await getPublciImg({
    page: page || pageNo.value,
    pageSize: pageSize.value,
  });
  // console.log(res);
  let { code, images: list } = res;
  loading.value = false;
  // console.log(code, list);
  list.forEach((item) => {
    images.value.push({ url: item.url, filename: item.filename });
  });
  if (pageSize.value > list.length) {
    loading.value = false;
    noMore.value = true;
  }
};

onMounted(() => {
  getList();
});

const loading = ref(false);
const noMore = ref(false);
const handleLoad = async () => {
  if (loading.value || noMore.value) {
    return;
  }
  pageNo.value += 1;
  getList(pageNo.value);
};
</script>

<style lang="css" scoped>
.public-wrap {
  height: calc(100vh - 140px);
  top: 70px;
  padding: 20px;
}

.waterfall {
  column-count: 5;
  column-gap: 8px;
}

.waterfall-image {
  width: 100%;
  display: block;
  margin-bottom: 8px;
  object-fit: cover;
}

.text {
  text-align: center;
  margin: 20px 0;
}

.lazy__img[lazy="loading"] {
  padding: 5em 0;
  width: 48px;
}

.lazy__img[lazy="loaded"] {
  width: 100%;
}
</style>
<style lang="css">
.c-water .lazy__img {
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
  object-fit: cover;
}
.c-water .lazy__img .lazy__img[lazy="error"] {
  padding: 0 !important;
  width: 80% !important;
}
</style>