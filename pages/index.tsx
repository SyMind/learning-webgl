import type { NextPage } from 'next'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
     hello, world!
    </div>
  )
}

export default Home

export async function getStaticProps() {
  return {
      props: { }
  }
}
