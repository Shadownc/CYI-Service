<template>
  <div>
    <n-layout
      position="absolute"
      style="top: 70px; padding-bottom: 100px"
      :native-scrollbar="false"
    >
      <n-flex justify="center" align="center" style="padding: 20px">
        <n-card style="width: 70%; height: 320px">
          <Upload @uploaded="handleAllUploaded" />
        </n-card>
      </n-flex>
      <n-flex justify="center" align="center" style="padding: 20px">
        <n-card
          style="width: 70%"
          content-style="padding: 0;"
          embedded
          :bordered="false"
          v-if="list.length == 1"
        >
          <TabInfo :fileInfo="list[0]"></TabInfo>
        </n-card>
        <n-card
          style="width: 70%"
          embedded
          :bordered="false"
          v-if="list.length > 1"
        >
          <n-flex justify="space-between" wrap class="card-flex">
            <n-card
              v-for="(item, index) in list"
              :key="index"
              content-style="padding: 0;"
              style="width: 19%"
            >
              <template #cover>
                <n-image
                  lazy
                  :src="item.url"
                  style="width: 100%; height: 170px"
                >
                  <template #placeholder>
                    <img
                      style="width: 100%; height: 100%"
                      src="https://images.100769.xyz/file/JBcQSD"
                    />
                  </template>
                </n-image>
              </template>
              <template #action>
                <n-flex justify="center">
                  <n-button type="info" @click="openModal(item)"
                    >点击查看</n-button
                  >
                </n-flex>
              </template>
            </n-card>
          </n-flex>
        </n-card>
      </n-flex>
    </n-layout>
    <ModalInfo v-model:show="showModal" :fileInfo="fileInfo" />
  </div>
</template>
  
  <script setup>
import Upload from "@/components/front/Upload.vue";
import TabInfo from "@/components/front/TabInfo.vue";
import ModalInfo from "@/components/front/ModalInfo.vue";
import { useModal } from "@/hooks/useModal";

const { showModal, fileInfo, openModal } = useModal();
const list = ref([]);

const handleAllUploaded = (uploadResults) => {
  list.value.push(...uploadResults);
  console.log(list.value);
};
</script>
  
  <style lang="css" scoped>
.card-flex::after {
  content: "";
  flex: auto;
}
</style>