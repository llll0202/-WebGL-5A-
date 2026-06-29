import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      component: () => import('@/views/Home/index.vue'),
      children: [
        {
          path: '',
          redirect: '/home/map',
        },
        {
          path: 'map/:provinceName?',
          name: 'map',
          component: () => import('@/views/Home/Country.vue'),
        },
      ],
    }
  ],
})

export default router
