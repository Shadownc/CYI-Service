import { ref } from 'vue';

export function useModal() {
    const showModal = ref(false);
    const fileInfo = ref({});

    const openModal = (item) => {
        fileInfo.value = item;
        showModal.value = true;
    };

    return {
        showModal,
        fileInfo,
        openModal
    };
}
