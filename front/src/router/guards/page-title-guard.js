const baseTitle = import.meta.env.VITE_TITLE

export function createPageTitleGuard(router) {
  router.afterEach((to) => {
    const pageTitle = to.meta?.title
    if (pageTitle) {
      // document.title = `${pageTitle} | ${baseTitle}`
      document.title = `${pageTitle}`
    }
    else {
      document.title = baseTitle
    }
  })
}
