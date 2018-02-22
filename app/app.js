const Vue = require('nativescript-vue/dist/index')
const VueRouter = require('vue-router')
const http = require("http")
Vue.use(VueRouter)
global.process = {env: {}} // hack! a build process should replace process.env's with static strings.
const config = {
  apikey : "56f29be5628960e21f71067fe6cb117b",
  baseurl: "http://image.tmdb.org/t/p/w"
}
const store = {
  state: {
    results:["something here"],
    selectedMovie:{reviews:[]},
    selectedTrailer:{},
    isSearching: false,
    isLoadingReviews: false,
    reviews:[],
    genres: [],
    videos: []
  },
  setResults(val){
    console.log("setting results")
    this.state.results = val
  },
  setSelectedMovie(val){
    console.log("setting movie--------")
    this.state.selectedMovie = {}
    this.state.selectedMovie = val
    this.setGenre(val.genres)
  },
  setGenre(genres){
    this.state.genres = []

    var that = this
    setTimeout(function (){
      that.state.genres = genres
    }, 100)
  },
  movieQuery(term){
    //trigger activity indicator
    this.state.isSearching = true
    var that = this
    //
    http.getJSON("https://api.themoviedb.org/3/search/movie?api_key="+config.apikey+"&query="+term).then(function (r) {
        // when data is rec'd we call setResults to mutate state object
        console.dir(r)
        that.setResults(r)  
        that.state.isSearching = false
    }, function (e) {
        //// Argument (e) is Error!
        console.log(e);
        that.state.isSearching = false
    });
  },
  getMovie(id){
    var that = this
    router.push('/movie')
    http.getJSON("https://api.themoviedb.org/3/movie/"+id+"?api_key="+config.apikey).then(function (r) {
      console.dir(r)
        that.setSelectedMovie(r) 
        that.getReviews() 
        that.getVideos()
    }, function (e) {
        //// Argument (e) is Error!
        console.log(e);
    });
  },
  getReviews(){
    var that = this
    that.state.isLoadingReviews = true
    http.getJSON("https://api.themoviedb.org/3/movie/"+this.state.selectedMovie.id+"/reviews?api_key="+config.apikey).then(function (r) {
      //console.dir(r)
      that.state.reviews = r.results
      console.dir(that.state.reviews)
      that.state.isLoadingReviews = false
    }, function (e) {
        //// Argument (e) is Error!
        that.state.isLoadingReviews = false
        console.log(e);
    });
  },
  getVideos(){
    var that = this
    that.state.isTrailersLoading = true
    http.getJSON("https://api.themoviedb.org/3/movie/"+this.state.selectedMovie.id+"/videos?api_key="+config.apikey).then(function (r) {
      //console.dir(r)
      that.state.videos = r.results
      console.dir(that.state.reviews)
      that.state.isTrailersLoading = false
    }, function (e) {
        //// Argument (e) is Error!
        that.state.isTrailersLoading = false
        console.log(e);
    })
  },
  setSelectedTrailer(vid){
    this.state.selectedTrailer = vid
  }
}
Vue.component('reviewList',{
  template:`
          <stack-layout>
            <ListView v-if="reviews" class="list-group" for="review in reviews" style="height:1250px">
              <v-template>
                <FlexboxLayout flexDirection="row" class="list-group-item">
                  <label :text="review.author"/>
                  <Label :text="review.content" class="list-group-item-heading" style="width: 60%" />
                </FlexboxLayout>
              </v-template>
            </ListView>
            <label v-else text="There are no reviews yet" />
          </stack-layout>`,
  props:['reviews'],
})
Vue.component('trailerList',{
  template:`
          <stack-layout>
            <label text="Trailers" />
            <wrap-layout>
              <image stretch="none" :src="'https://img.youtube.com/vi/'+video.key+'/mqdefault.jpg'" v-for="video in videos" :key="video.key" @tap="startTrailer(video)"/>
            </wrap-layout>
          </stack-layout>`,
  props:['videos'],
  methods:{
    startTrailer(video){
      store.setSelectedTrailer(video)
      this.$router.push('/trailer')
    }
  }
})
const SearchPage = {
  template: `
    <stack-layout>
      <SearchBar hint="Search hint" v-model="searchString" @submit="onButtonTap" />
      <ActivityIndicator v-if="isSearching" :busy="isSearching" class="activity-indicator" />
      <ScrollView>
        <WrapLayout>
          <Image stretch="none" v-for="movie in sharedState.results.results" :src="combine(movie.poster_path)" :key="movie.id" class="image-thumb" @onTap="openMovie(movie)" />
        </WrapLayout>
      </ScrollView>
    </stack-layout>
  `,
  data(){
    return {
      searchString:'',
      sharedState: store.state,
    }
  },
  computed:{
    isSearching(){
      return store.state.isSearching;
    }
  },
  methods:{
    onButtonTap(){
      console.log("tapped")
      store.movieQuery(this.searchString)
    },
    combine(path){
      //returns the full url for the images 
      if(path){  
        return url = config.baseurl.toString()+'185/' + path.toString()
      }else{return ""}
    },
    openMovie(movie){
      // triggered when users click on image on home screen
      store.getMovie(movie.id)
    }
  }
}
const Movie = {
    template: `
      <ScrollView>
      <stack-layout orientation="vertical" class="body-padding">
        <stack-layout orientation="horizontal" class="body-padding">
            <image :src="imageUrl" class="image-half" @tap="showModal"/>
            <stack-layout orientation="vertical" class="body-padding">
              <label :text="sharedState.selectedMovie.title" class="title" textWrap="true"/>
              <wrap-layout>
                <label text="Release Date: " fontWeight="Bold" />
                <label :text="sharedState.selectedMovie.release_date " />
              </wrap-layout>
              <wrap-layout>
                <label text="Genre: " fontWeight="Bold" />
                <label v-for="(genre, index) in sharedState.genres" :text="(index!==(sharedState.genres.length-1))?genre.name+', ' :genre.name" :key="genre.id" />
              </wrap-layout>
              <wrap-layout>
                <label text="Duration: " fontWeight="Bold" />
                <label :text="hours" />   
                <label :text="minutes" /> 
              </wrap-layout>
              <label text="View Trailer" @tap="showTrailer"/> 
            </stack-layout>
        </stack-layout>
        <trailer-list :videos="sharedState.videos"/>
        <label :text="sharedState.selectedMovie.overview" textWrap="true"/>
        <review-list :reviews="reviews"/>
        </stack-layout>
      </ScrollView>
    `,
    data(){
      return {
        sharedState: store.state
      }
    },
    computed:{
      imageUrl(){
        if(this.sharedState.selectedMovie.poster_path){  
          var url = config.baseurl.toString()+'185/' + this.sharedState.selectedMovie.poster_path.toString()
          console.log(url)
          return url
        }else{return ""}
      },
      hours(){
        return Math.floor(parseInt(this.sharedState.selectedMovie.runtime) /60) + 'hrs '
      },
      minutes(){
        return parseInt(this.sharedState.selectedMovie.runtime) %60 + 'mins'
      },
      reviews(){
        console.log('dumping reviews--------')
        console.dir(this.sharedState.reviews)
        return this.sharedState.reviews
      }
    },
    methods:{
      showModal(){
        this.$showModal(Picture)
      },
      showTrailer(){
        this.$router.push('/trailer')
      }
    }
}
const Picture = {
    template: `
      <stack-layout>
          <image :src="imageUrl" @tap="$modal.close()"/>
      </stack-layout>
    `,
    data(){
      return {
        sharedState: store.state
      }
    },
    computed:{
      imageUrl(){
        if(this.sharedState.selectedMovie.poster_path){  
          return url = config.baseurl.toString()+'500/' + this.sharedState.selectedMovie.poster_path.toString()
        }else{return ""}
      }
    },
}
const Trailer = {
  template:`
  <WebView :src="youtube" height="100%" />
  `,
  data(){
    return {
      youtube:'https://www.youtube.com/embed/'+store.state.selectedTrailer.key
    }
  }
}

const router = new VueRouter({
    pageRouting: false,
    routes: [
        {path: '/home', component: SearchPage},
        {path: '/movie', component: Movie},
        {path: '/picture', component: Picture},
        {path: '/trailer', component: Trailer},
        {path: '*', redirect: '/home'}
    ]
})

router.push('/home')

new Vue({
    router,
    template: `
        <page>
            <ActionBar>
              <NavigationButton :visibility="visibility" text="Go back" android.systemIcon="ic_menu_back" @tap="$router.back()" />
            </ActionBar>
            <stack-layout>
              <router-view></router-view>
            </stack-layout>
        </page>
    `,
    computed: {
      visibility: function () {
        // to hide navigation back button when home
        if (this.$route.path === '/home'){
          return 'collapse'
        }else{
          return 'visible'
        }
      }
    }
}).$start()