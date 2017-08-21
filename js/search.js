/**
 * Created by Administrator on 2017/7/7.
 */
/*config*/
var map;
var  mapId=[]//添加的底图id
    ,shapeLayerId = "landLayer"
    ,iconLayerId = "iconLayer";
mapInit();
// 地图服务
function mapInit() {
    // mapDataUrl: 含有地图信息的url
    var mapDataUrl='http://172.28.76.22/onemapsrv/mapview?appid=sipbwmap&xusername=yqgh';
    $.ajax(mapDataUrl).done(function (response) {
        // 初始化Map
        creatMap(response);
        // 从地图服务获取所有底图并加入map
        addBase(response)
        // 加载底图后创建搜索结果展示图层
        $.subscribe("loadOneTileMapOk",addLayer);
    });
    function creatMap(response) {
        //console.log(response);
        require(["esri/map", "esri/geometry/Point", "esri/SpatialReference", "esri/geometry/Extent", "dojo/domReady!"],
            function (Map, Point, SpatialReference, Extent) {
                //根据返回结果配置map
                var extent = response.data.defaultMapExtent.split(',');
                var sr = new SpatialReference(response.data.spatialReference);
                //配置map
                map = new Map("map", {
                    zoom: 6,
                    extent: new Extent(parseFloat(extent[0]), parseFloat(extent[1])
                        , parseFloat(extent[2]), parseFloat(extent[3]), sr),
                    maxScale:2000,
                    logo:false,
                    showAttribution:false

                });
            })
    }

    /*已废弃 循环加载地图 原因：复杂*/
    //从地图服务获取所有底图并加入map
    // function getTiledMaps(response) {
    //     for(var i=0;i<response.data.baseMap.length;i++){
    //         var data=response.data
    //             ,mapUrl=data.baseMap[i].serviceUrl
    //             ,tokenName=data.baseMap[i].tokenName;
    //         //根据data.basemap.tokenname，在data.token中查询获取地图对应token 拼url
    //         //console.log('获取地图对应token 拼url');
    //         for(var index in data.token){
    //             if(data.token[index].name==tokenName){
    //                 $.ajax({
    //                     url:data.token[index].url,
    //                     async: false}
    //                 ).done(function (responseToken) {
    //                     //console.log(mapUrl);
    //                     mapUrl += '?token=' + responseToken;
    //                 })
    //             }
    //         }
    //         /*将第index个切片地图加入map */
    //         addTileToMap(i,mapUrl);
    //     }
    // }
    // /*将第index个切片地图加入map */
    // function addTileToMap(index,mapUrl) {
    //     require(["esri/map","esri/layers/ArcGISTiledMapServiceLayer"],
    //         function(Map, ArcGISTiledMapServiceLayer) {
    //             var tiled = new ArcGISTiledMapServiceLayer(mapUrl);
    //             tiled.id=mapId[index];
    //             //默认显示第一个,其他隐藏
    //             if(index!=0){tiled.visible=false;}
    //             map.addLayer(tiled);
    //         }
    //     );
    // }
    //添加用于展示搜索结果的图层
    /*简化版*/
    function addBase(response) {
        addLabel(response,[0,1]);//显示底图按钮
        getTileMap(response,0);// 添加底图0
        getTileMap(response,1);// 添加影像图1
    }
    function addLabel(response,args) {
        for(var i in args){
            $('.toggle span:eq('+i+')').text(response.data.baseMap[i].label)
            $('.toggle div:eq('+i+')').show();
        }
    }
    function getTileMap(response,index) {
        var tileMap = response.data.baseMap[index]
            ,token =response.data.token
            ,url= tileMap.serviceUrl+"?token="
        for(var i in token){
            // 根据tokenName获取地图对应token
            if(token[i].name==tileMap.tokenName){
                //url += loadTileMap(token[i].url);
                return loadTileMap({
                    tokenUrl:token[i].url
                    ,serviceUrl:url
                    ,mapIndex:index
                    ,tileMapId:tileMap.id})
            }
        }
        //console.log(response);
        // 添加切片图层到map
        // require(["esri/map","esri/layers/ArcGISTiledMapServiceLayer"],
        //     function(Map, ArcGISTiledMapServiceLayer) {
        //         var tiled = new ArcGISTiledMapServiceLayer(url);
        //         tiled.id=tileMap.id;
        //         mapId.push(tiled.id);
        //         //默认显示第一个,其他隐藏
        //         if(index!=0){tiled.visible=false;}
        //         map.addLayer(tiled);
        //    }
        //);
    }
    // 从url获取token
    function loadTileMap(obj) {
        // tokenUrl:
        // serviceUrl:url,
        // mapIndex:index,
        // tileMapId:tileMap.id
        $.ajax({
                url:obj.tokenUrl
            }
        ).done(function (responseToken) {
            require(["esri/map","esri/layers/ArcGISTiledMapServiceLayer"],
                function(Map, ArcGISTiledMapServiceLayer) {
                    var tiled = new ArcGISTiledMapServiceLayer(obj.serviceUrl + responseToken);
                    tiled.id=obj.tileMapId;
                    mapId.push(tiled.id);
                    //默认显示第一个,其他隐藏
                    if(obj.mapIndex!=0){tiled.visible=false;}
                    map.addLayer(tiled);
                });
            $.publish("loadOneTileMapOk");
        })
    }
    // 添加用于显示搜索结果的图层
    function addLayer() {
        require(["esri/layers/GraphicsLayer"], function(GraphicsLayer) {
            map.addLayer(new GraphicsLayer({
                id:shapeLayerId
            }));
            map.addLayer(new GraphicsLayer({
                id:iconLayerId
            }))
        });
        //加载完毕，取消订阅
        $.unsubscribe("loadOneTileMapOk",addLayer);
    }
}


/*按钮事件*/
$(".search-btn").click(function() {
    $(".resultView").slideUp('fast');// 关闭结果显示
    $('.search img').show();// loading show
    //获取数据
    $.ajax({
        url:"http://172.28.76.22/onemapsrv/dmdzResult?appid=sipbwmap&name=%E5%9C%B0%E5%90%8D%E5%9C%B0%E5%9D%80&key=%E6%B5%8B%E7%BB%98%E5%9C%B0%E7%90%86"
    }).done(function (data,textStatus) {
        //搜索data
        //编个数据用
       var results={"status":1,"message":"","data":[
           { "name":"弘信创业工场项目1"
               , "shape":"POINT(70000 45000)"
               , "showlist":{
               "地块号":"地块1",
               "用地性质":"M1 一类工业用地",
               "红线面积$公顷":".22"
           }  },
           { "name":"弘信创业工场项目2"
           , "shape":"POINT(72000 42000)"
            , "showlist":{
            "地块号":"地块2",
                "用地性质":"M1 一类工业用地",
                "红线面积$公顷":".222222"}
           },
           { "name":"弘信创业工场项目3"
               , "shape":"POINT(60000 45000)"
               , "showlist":{
               "地块号":"地块1",
               "用地性质":"M1 一类工业用地",
               "红线面积$公顷":".22"
           }  },
           { "name":"弘信创业工场项目4"
               , "shape":"POINT(67000 48000)"
               , "showlist":{
               "地块号":"地块1",
               "用地性质":"M1 一类工业用地",
               "红线面积$公顷":".22"
           }  },
           { "name":"弘信创业工场项目5"
               , "shape":"POINT(75900 42000)"
               , "showlist":{
               "地块号":"地块1",
               "用地性质":"M1 一类工业用地",
               "红线面积$公顷":".22"
           }  },
           { "name":"弘信创业工场项目6"
               , "shape":"POINT(65000 55000)"
               , "showlist":{
               "地块号":"地块1",
               "用地性质":"M1 一类工业用地",
               "红线面积$公顷":".22"
           }  },
           { "name":"弘信创业工场项目7"
               , "shape":"POINT(70000 58000)"
               , "showlist":{
               "地块号":"地块1",
               "用地性质":"M1 一类工业用地",
               "红线面积$公顷":".22"
           }  },
           { "name":"弘信创业工场项目8"
               , "shape":"POINT(60000 45000)"
               , "showlist":{
               "地块号":"地块1",
               "用地性质":"M1 一类工业用地",
               "红线面积$公顷":".22"
           }  }
       ]
       };
        results=results.data;

        //console.log(results);
        search(results,$(".search-input").val());
        $('.search img').hide(); //loading end
    });
});
/*查询功能*/
function search(data,input) {
    /*根据input查询*/
    var searchResult = new Array();
    data.forEach(function (item) {
        if(!input||item.name.indexOf(input)!=-1){
            searchResult.push(item);//搜索结果：input为空或者包含input字符串
        }
    });
    $(".total").text(searchResult.length);
    if(searchResult.length==0) {
        //没有结果
        $(".resultView-content").text('没有搜索结果')
        $(".resultView").slideDown();//展示结果
        return
    }
    openPage(searchResult);/*分页生成*/
    clickGraphic(searchResult)//点击图形事件
    $(".resultView").slideDown();

    /*分页生成*/
    function openPage(data) {
        var nums = 5; //每页出现的数据量
        //调用分页
        laypage({
            cont: "page"
            , pages: Math.ceil(data.length / nums) //得到总页数
            , first: false
            , last: false
            , jump: function (obj) {
                clearIcons(); //清空  /*2.0新增*/
                render(data,nums,obj.curr);//分页渲染
                centerAtResult();//聚焦
                clickResult(obj.curr);//点击result事件
            }
        });
        //将所有搜索结果纳入显示
        function centerAtResult() {
            //将结果point加入Multipoint,并聚焦到该Multipoint
            var graph = map.getLayer(iconLayerId).graphics;
            require(["esri/geometry/Extent","esri/geometry/Multipoint"], function(Extent,Multipoint) {
                var mp = new Multipoint(map.spatialReference);
                for(var i in graph){
                    mp.addPoint(graph[i].geometry);
                }
                map.setExtent(mp.getExtent().expand(3));
            });
        }
        //点击resultView，显示信息并聚焦
        function clickResult(currPage){
            $(".resultView-content ul li").click(function () {
                var graphicIndex = currPage*nums-nums+$(this).index(); //图形在搜索结果中的索引
                var result = searchResult[graphicIndex];//result Json
                var gra = map.getLayer(iconLayerId).graphics[$(this).index()];//graphic
                var point = gra.geometry;
                map.infoWindow.setTitle(result.name);
                map.infoWindow.setContent(buildShowlist(result.showlist).html());
                map.infoWindow.show(point);
                map.centerAt(point);
                //若result为多边形则显示范围
                showPolygon(result);
            });
        }
    }
    /*渲染分页*/
    function render(data,nums,curr) {
        var thisData = data.slice(curr * nums - nums, curr * nums);//取出要展示的条数
       // 构造ul
            var $resultList = $("<ul></ul>");
            //构造每一条结果
            $.each(thisData,function (index,item) {
                //每行设置不同的背景图片url
                var url="poi/" + (index + 1).toString() + ".png"
                    ,imageUrl =  'url("' + url + '")';
                var $oneResult = $("<li></li>").text(item.name).css("background-image",imageUrl);
                //根据showlist，使用BuildShowlist（）构造li
                for (var key in item){
                    if(key=="showlist"){
                        buildShowlist(item[key]).appendTo($oneResult);
                    }
                    $oneResult.appendTo($resultList);
                }
                //将结果列表的位置标记在地图上
                showInfo({
                    data:item,
                    sysUrl:url,
                    graphicIndex:curr*nums-nums+index});
                //暂时没用
                //var geometry =getGeometry(item.shape);
                // 绑定点击事件
                // $oneResult.click(function(){
                //     clearShapes();
                //     showShape({data:item});
                // });
            });
            // 构造好的ul加入页面中
            $resultList.prependTo($(".resultView-content"));
            //显示结果
            $('.resultView').slideDown();
            return;
        //下面的暂时没用
        function getGeometry(wkt) {
            var geometry;
            wktToGeometry.startParse({
                wkt:wkt
                , spatialReference: map.spatialReference
                , callback: function (g) {geometry=g}
            });
            return geometry;
        }
        // 显示图形:point则聚焦到点，polygon则显示范围
        function showShape(obj) {
            // obj.data         包含信息shape,att,name,showlist
            // obj.data.shape   wkt
            //wkt转geometry
            /*2.0新增*/
            wktToGeometry.startParse({
                wkt: obj.data.shape
                ,spatialReference:map.spatialReference
                , callback: function (p) {
                    //点击搜索结果显示弹窗
                    clickToShowInfoWindow(obj,p);
                    if(p.type=="point"){
                        //聚焦到点
                        map.centerAt(p);
                    }
                    if(p.type=='polygon') {
                        //聚焦到图形中心并显示范围
                        map.centerAt(p.getExtent().getCenter());  //version 3.8.  support getCentroid()
                        addPolygon(p, map.getLayer(shapeLayerId));
                    }
                }
            });
            //点击搜索结果显示弹窗
            function clickToShowInfoWindow(obj,point) {
                map.infoWindow.setTitle(obj.data.name);
                map.infoWindow.setContent(buildShowlist(obj.data.showlist).html());
                map.infoWindow.show(point);
            }
            //将图形显示在地图上
            /*2.0新增*/
            //暂时失去了作用
            function addPolygon(polygon,layer) {
                require(["esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol",
                        "esri/Color","esri/graphic","esri/InfoTemplate"],
                    function(SimpleFillSymbol, SimpleLineSymbol, Color,Graphic,InfoTemplate) {
                        //设定图
                        var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID
                            ,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 2)
                            ,new Color([98,194,204,0.5])
                        );
                        //试验用
                        var att="",
                            info=new InfoTemplate("1111","1111111111");
                        layer.add(new Graphic(polygon,symbol,att,info));

                    })


            }
        }
        // 将结果列表的位置标记在地图上
        function showInfo(obj){
            // obj.data      包含信息shape,att,name,showlist
            // obj.sysUrl    PictureMarkerSymbol的url
            // obj.graphicIndex 当前图形在搜索结果searchResults中的索引
            // 将obj的中心点加入iconLayer，显示图标
            wktToGeometry.startParse({
                wkt:obj.data.shape
                , spatialReference: map.spatialReference
                , callback: function (p) {
                    var geo;
                    if(p.type=='point')
                    {
                        geo=p;
                    }
                    if(p.type=='polygon'){
                        geo = p.getExtent().getCenter()//得到形心
                    }
                    require(["esri/graphic","esri/symbols/PictureMarkerSymbol","esri/InfoTemplate"]
                        ,function(Graphic,PictureMarkerSymbol,InfoTemplate) {
                        var sym =new PictureMarkerSymbol(obj.sysUrl,30,30);
                            //info=new InfoTemplate(obj.data.name,buildShowlist(obj.data.showlist).html());
                            //info内容遍历showlist得到
                            var attr={"index":obj.graphicIndex};
                            map.getLayer(iconLayerId).add(new Graphic(geo,sym,attr));
                    });
                }
            });
        }
    }

    /*展示showlist*/
    function buildShowlist(item) {
        /*以div形式构造表格*/
        var $content = $("<div></div>").css("display","table");
        for (var key in item) {
            var $row = $("<div></div>").css("display","table-row");
            //将key中 $前的文字 赋给左div，将 $后的文字 加在右div上
            $("<div></div>").text(key.replace(/\$.*/,"") + ":").css({"display":"table-cell","text-align":"right","white-space":"nowrap"}).appendTo($row);
            $("<div></div>").text(item[key]+key.replace(/^.*\$|.*/,"")).css("display","table-cell").appendTo($row);
            $row.appendTo($content);
        }
        return $content;
    }
    //显示图形信息
    function clickGraphic(searchResult) {
        require(["dojo/on"],function(on) {
            on(map.getLayer(iconLayerId), "click", function (event) {
                var graphic = event.graphic;
                var index = graphic.attributes.index;
                var result = searchResult[index];
                map.infoWindow.setTitle(result.name);
                map.infoWindow.setContent(buildShowlist(result.showlist).html());
                map.infoWindow.show(graphic.geometry);
                //若result为多边形则显示范围
                showPolygon(result);
            });
        });
    };
    //显示result边界范围
    function showPolygon(result){
        //清空图形图层
        clearShapes();
        if(result.shape.indexOf('POLYGON')){
            addPolygon(getGeometry(result.shape),map.getLayer(shapeLayerId));
        }

        function getGeometry(wkt) {
            var geometry;
            wktToGeometry.startParse({
                wkt:wkt
                , spatialReference: map.spatialReference
                , callback: function (g) {geometry=g}
            });
            return geometry;
        }
        function addPolygon(polygon,layer) {
            require(["esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol",
                    "esri/Color","esri/graphic","esri/InfoTemplate"],
                function(SimpleFillSymbol, SimpleLineSymbol, Color,Graphic,InfoTemplate) {
                    var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID
                        ,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 2)
                        ,new Color([98,194,204,0.5])
                    );
                    //试验用
                    // var att="",
                    //     info=new InfoTemplate("1111","1111111111");
                    layer.add(new Graphic(polygon,symbol));

                })


        }
    }
    function clearShapes() {
        //若已有图形存在，则清空landLayer
        if (map.getLayer(shapeLayerId).graphics.length != 0) {
            map.getLayer(shapeLayerId).clear();
        }
    }
    /*2.0新增
     * 清空图层*/
    function clearIcons() {
        //关闭弹窗
        map.infoWindow.hide();
        //清空图层
        clearShapes();
        //清除已存在的 用于显示弹窗的点
        if(map.getLayer(iconLayerId).graphics.length!=0){
            map.getLayer(iconLayerId).clear();
        }
    }
};
/*
 */
/*input绑定enter*/
$(".search-input").keydown(function (event) {
    if(event.which == 13){
        $(".search-btn").click();
    }
})
/*关闭按钮*/
$(".resultClose").click(function () {
    $('.resultView').slideUp();
})




// 切换按钮图片
function toggleBtn(jquery) {
    //jquery: $(this)
    //为被选中的按钮添加class:"active"
    if (!jquery.hasClass("active")) {
        jquery.siblings().removeClass("active blue");
        jquery.addClass("active blue");
    }
    //含有class:"active"的显示含有"2"的图片，未被选中的显示含有"1"的图片
    togglePic();
    function togglePic() {
        $(".toggle img").attr("src", function (index, value) {
            if ($(this).parent().hasClass("active")) {
                return value.replace("1", "2");
            }
            return value.replace("2", "1");
        });
    }
}
/*底图切换按钮*/
$('.toggle >:eq(0)').click(function () {
    if(!map.getLayer(mapId[0]).visible){
        map.getLayer(mapId[1]).hide();
        map.getLayer(mapId[0]).show();
    }
    toggleBtn($(this));

});
$(".toggle >:eq(1)").click(function () {
    if(!map.getLayer(mapId[1]).visible){
        map.getLayer(mapId[0]).hide();
        map.getLayer(mapId[1]).show();
    }
    toggleBtn($(this));
});
/*鼠标划过效果*/
$('.toggle div').hover(function () {
    if ($(this).hasClass("active")){
        return
    }
    $(this).find("img").attr("src", function (index, value) {
        return value.replace("1", "2");
    });
    $(this).addClass("blue");
},
    function () {
    if ($(this).hasClass("active")){return}
        $(this).find("img").attr("src", function (index, value) {
            return value.replace("2", "1");
        });
        $(this).removeClass("blue");

});

//test
$('.toggle .test').click(function () {
    require([
        "esri/geometry/Point","esri/layers/GraphicsLayer",
        "esri/symbols/PictureMarkerSymbol", "esri/symbols/SimpleLineSymbol",
        "esri/Color", "esri/graphic","esri/InfoTemplate","esri/geometry/Polygon"
        ,"esri/symbols/SimpleFillSymbol","esri/SpatialReference","esri/dijit/InfoWindow"
        ,"dojo/dom-construct"
    ], function (Point,GraphicsLayer,PictureMarkerSymbol,
                 SimpleLineSymbol, Color, Graphic,InfoTemplate,Polygon
        ,SimpleFillSymbol,SpatialReference,InfoWindow,domConstruct ) {
        var pt = new Point(64533.3,47509.0,map.spatialReference);
        var template = new InfoTemplate("1111","1111111111");
        var sym = new PictureMarkerSymbol("poi/1.png",30,30);
        var g = new Graphic(pt,sym);
        map.graphics.add(g);
        var graphicsLayer = new GraphicsLayer({infoTemplate: template});
        map.infoWindow.setTitle('11');
        map.infoWindow.setContent("22");
        map.infoWindow.show(pt);
        map.centerAt(pt);
    });
});

//jquery发布订阅扩展
(function($) {

    var o = $({});

    $.subscribe = function() {
        o.on.apply(o, arguments);
    };

    $.unsubscribe = function() {
        o.off.apply(o, arguments);
    };

    $.publish = function() {
        o.trigger.apply(o, arguments);
    };

}(jQuery));

