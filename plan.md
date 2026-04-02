个人AI实践记录网站开发技术实现方案（AI Coding 适配版）

第一章 项目技术概述

1.1 项目技术背景

本项目为前后端分离架构的个人AI实践记录平台，核心目标是通过编码实现AI热点爬取、GitHub资源聚合、Gemini AI接口集成、多端适配展示等功能，为技术开发人员提供可直接参考、可复用的AI coding实践案例。项目聚焦技术落地，所有设计均围绕“可编码、可调试、可扩展”展开，规避冗余的非技术描述，重点明确各模块的技术实现逻辑、编码规范及依赖关系。

核心技术痛点解决：明确爬虫脚本编写规范、AI接口封装逻辑、前后端数据交互格式、服务器部署脚本，解决AI实践中“资源分散、接口集成复杂、部署繁琐”的编码痛点，提供端到端的技术实现方案，供开发人员直接参考编码、二次开发。

技术栈定位：前端Vue3+Vite+TS（强类型编码）、后端SpringBoot3+MyBatis-Plus、爬虫Python+Scrapy、AI集成Gemini API，所有技术选型均兼顾“主流性、可扩展性、编码友好性”，配套编码规范及示例，降低AI coding门槛。

1.2 项目技术目标

1.2.1 功能编码目标（可直接落地）

- 前后端分离架构编码：完成前端组件化开发、后端接口开发，实现接口标准化（RESTful规范），支持跨域请求，页面加载速度≤3秒（编码层面优化：路由懒加载、接口缓存）。

- 页面编码：完成1个一级页面、9个二级页面、27-36个三级页面的组件开发，遵循Vue3组件化规范，实现科幻科技风格动画（CSS3+Three.js可选），确保组件复用率≥60%。

- 爬虫编码：编写可复用爬虫脚本，实现每日定时爬取50条AI热点新闻（去重逻辑编码）、GitHub Top10 AI Agent/Skill（多线程爬取优化），支持异常重试、数据清洗，爬取结果入库自动化。

- 文件上传编码：实现多格式文件（文本、文档、图片）上传接口，支持分片上传（大文件适配），文件存储对接阿里云OSS/本地存储，编码包含文件校验、病毒扫描（基础版）逻辑。

- AI接口集成编码：封装Gemini API调用工具类，实现上传资料的自动分析、总结，编码包含接口签名、超时重试、异常捕获、结果格式化逻辑，单份≤10MB资料分析时间≤60秒。

- 响应式编码：适配PC端、平板、手机，编码采用Flex/Grid布局+Media Query，确保不同设备界面兼容性，无布局错乱。

1.2.2 技术编码规范目标

- 前端编码：遵循ESLint+Prettier规范，使用TypeScript强类型约束，组件划分遵循“原子化组件-业务组件-页面组件”分层，路由配置统一管理，请求封装统一拦截。

- 后端编码：遵循Java编码规范（阿里巴巴Java开发手册），采用分层架构（Controller-Service-Dao），接口参数校验、全局异常处理、日志打印（SLF4J）统一实现，代码注释覆盖率≥80%。

- 爬虫编码：遵循Python PEP8规范，脚本模块化开发（爬取模块、清洗模块、入库模块分离），配置文件与代码分离，支持配置动态修改（爬取频率、目标地址）。

- AI接口编码：封装统一的AI调用工具类，支持多AI模型扩展（预留接口），API密钥加密存储，调用日志可追溯，异常信息标准化返回。

1.2.3 性能与安全编码目标

- 性能编码：前端实现路由懒加载、图片懒加载、接口缓存（Pinia+LocalStorage）；后端实现接口缓存（Redis可选）、数据库索引优化、分页查询；爬虫实现多线程/异步爬取，避免阻塞。

- 安全编码：后端接口实现JWT Token认证，参数防注入、XSS过滤；文件上传实现格式校验、大小限制；爬虫实现请求头伪装、爬取频率控制（遵守robots协议）；数据存储实现敏感信息加密。

1.3 项目编码范围（明确可编码模块）

1.3.1 编码功能范围

- 前端编码：组件开发、路由配置、请求封装、动画实现、响应式适配、页面交互逻辑（含资料上传、AI分析结果展示）。

- 后端编码：接口开发（RESTful）、业务逻辑实现、数据访问层编码、权限认证、异常处理、文件上传/下载接口、AI接口封装。

- 爬虫编码：AI热点新闻爬取脚本、GitHub资源爬取脚本、数据清洗脚本、定时任务脚本、数据入库脚本。

- 部署编码：服务器环境配置脚本、Docker容器化配置（可选）、Nginx反向代理配置、域名解析配置、服务启停脚本。

- AI集成编码：Gemini API调用封装、分析结果格式化、API密钥管理、异常重试逻辑。

1.3.2 技术编码范围（明确版本与依赖）

- 前端技术（明确版本）：Vue3.3+、Vite4.4+、Pinia2.1+、Vue Router4.2+、Element Plus2.4+、TypeScript5.1+、Axios1.6+、Three.js0.160+（可选），依赖管理使用npm/yarn。

- 后端技术（明确版本）：SpringBoot3.2+、SpringMVC6.1+、MyBatis-Plus3.5+、MySQL8.0+、Redis7.0+（可选）、JWT0.11+、Java17+，依赖管理使用Maven3.8+。

- 爬虫技术（明确版本）：Python3.9+、Scrapy2.11+、BeautifulSoup4.12+、Selenium4.10+、APScheduler3.10+、PyMySQL1.1+，依赖管理使用pip。

- AI接口：Gemini API v1，调用方式为HTTP请求，封装使用Python/Java工具类。

- 部署技术：阿里云ECS（CentOS8）、Nginx1.24+、Tomcat9.0+、Docker24+（可选），配置文件标准化编写。

1.3.3 编码排除范围（明确不编码内容）

- 复杂权限管理：仅编码基础JWT认证，不编码RBAC权限模型、多角色管理（预留扩展接口）。

- AI模型本地部署：仅编码Gemini API调用逻辑，不编码本地AI模型（如LLaMA、ChatGLM）的部署、训练代码。

- 高并发优化：仅编码基础并发适配（接口缓存、多线程爬虫），不编码分布式部署、负载均衡（如Nginx集群）。

- 多语言支持：仅编码中文界面及接口，不编码多语言切换逻辑。

- 复杂可视化：仅编码基础列表、详情展示，不编码ECharts等复杂图表的编码实现（预留图表接口）。

1.4 项目编码意义

本方案核心价值为“可直接参考编码、可快速落地实践”，为AI coding提供端到端的技术实现案例，具体如下：

- 编码实践价值：提供前后端分离、爬虫、AI接口集成、服务器部署的完整编码示例，涵盖常用技术栈的核心用法，可直接复用代码片段，提升AI实践编码效率。

- 技术复用价值：模块化编码设计，各模块（爬虫、AI接口、文件上传）可独立抽取、二次开发，适配不同AI实践场景。

- 编码规范价值：统一各技术栈的编码规范，提供注释模板、接口规范、目录结构，帮助开发人员养成标准化编码习惯。

第二章 技术架构与编码规划

2.1 项目整体架构设计（编码视角）

采用前后端分离架构，严格遵循“分层编码、模块解耦”原则，各层编码独立、接口标准化，便于调试、复用及扩展。整体架构分为6层，各层编码职责明确，具体如下：

2.1.1 架构分层编码详情（明确编码职责）

（1）前端层（编码重点：组件化、交互、请求封装）

编码职责：实现页面组件开发、路由配置、请求封装、动画效果、响应式适配，遵循Vue3+TS编码规范，核心编码模块如下：

- 组件模块：原子化组件（按钮、输入框、卡片）、业务组件（资料上传组件、AI分析结果组件）、页面组件（各层级页面），组件通信采用Props/Emits、Pinia全局状态管理。

- 路由模块：使用Vue Router配置一级/二级/三级路由，实现路由懒加载（编码示例：const Home = () => import('@/views/Home.vue')），配置路由守卫（权限校验）。

- 请求模块：封装Axios，统一配置请求基地址、请求头、超时时间，实现请求拦截（Token携带）、响应拦截（异常统一处理）。

- 动画模块：使用CSS3实现页面过渡动画、元素交互动画，可选Three.js实现3D科幻背景（编码示例：创建场景、相机、渲染器，加载模型）。

- 响应式模块：使用Flex/Grid布局，结合Media Query实现多设备适配，编码避免固定像素，采用rem/vw单位。

编码规范：组件目录结构统一（src/components/原子组件/业务组件）、路由配置集中（src/router/index.ts）、请求封装集中（src/utils/request.ts），注释包含组件功能、参数说明、使用场景。

（2）后端层（编码重点：接口开发、业务逻辑、数据访问）

编码职责：实现RESTful接口开发、业务逻辑处理、数据校验、权限认证，遵循SpringBoot分层编码规范，核心编码模块如下：

- Controller层：接收前端请求，参数校验（使用JSR380注解：@NotNull、@NotBlank），返回标准化响应（统一响应体：code、message、data）。

- Service层：实现核心业务逻辑（资料上传、AI接口调用、数据查询），事务管理（@Transactional），业务逻辑模块化，避免冗余代码。

- Dao层：使用MyBatis-Plus实现数据访问，编码避免SQL硬编码，使用LambdaQueryWrapper查询，配置分页插件、逻辑删除。

- 权限认证模块：实现JWT Token生成、校验，编码包含Token工具类、拦截器（拦截未授权请求）。

- 异常处理模块：实现全局异常处理器（@RestControllerAdvice），统一处理业务异常、系统异常、参数异常，返回标准化错误信息。

编码规范：包结构统一（com.ai.practice.controller/service/dao/entity/util）、接口路径统一（/api/v1/模块名/接口名）、响应体统一（Result<T>），注释包含接口功能、参数说明、返回值说明。

（3）数据层（编码重点：表结构设计、数据存储、数据加密）

编码职责：设计数据库表结构、实现数据存储逻辑、数据加密，核心编码模块如下：

- 表结构设计：使用MySQL8.0，编码实体类（Entity），与数据库表一一对应，使用MyBatis-Plus注解（@TableName、@TableId、@TableField）配置表信息。

- 数据存储：结构化数据（新闻、资源、用户信息）存储至MySQL，非结构化数据（文件、图片）存储至阿里云OSS/本地，编码包含OSS工具类、文件存储路径管理。

- 数据加密：敏感数据（如API密钥）使用AES加密存储，编码包含加密/解密工具类，避免明文存储。

核心表结构（简化编码参考）：AI热点新闻表（ai_news）、GitHub Agent表（github_agent）、GitHub Skill表（github_skill）、用户上传资料表（user_file）、AI分析结果表（ai_analysis）。

（4）爬虫层（编码重点：脚本开发、数据清洗、定时任务）

编码职责：编写爬虫脚本，实现数据爬取、清洗、入库，核心编码模块如下：

- 爬取模块：使用Scrapy框架编写爬虫（AI热点爬虫、GitHub爬虫），编码包含爬虫配置（settings.py）、爬虫类（spiders目录下），实现请求头伪装、动态页面爬取（Selenium）。

- 数据清洗模块：编码清洗逻辑，去除无效数据、去重（根据标题/URL）、格式化数据（统一日期格式、字段命名），使用BeautifulSoup/XPath解析页面。

- 入库模块：编码PyMySQL工具类，实现爬取数据批量入库，包含入库异常处理、重试逻辑。

- 定时任务模块：使用APScheduler配置定时任务，编码定时逻辑（每日固定时间爬取），支持任务启停、日志打印。

编码规范：爬虫脚本模块化（爬取、清洗、入库分离）、配置文件集中（settings.py）、日志打印（logging模块），注释包含爬虫目标、爬取规则、数据字段说明。

（5）AI服务层（编码重点：API封装、异常处理、结果格式化）

编码职责：封装Gemini API调用逻辑，实现AI分析功能，核心编码模块如下：

- API封装模块：编码AI调用工具类（Python/Java），统一配置API密钥、请求地址、超时时间，实现请求参数封装、响应结果解析。

- 异常处理模块：编码异常捕获逻辑，处理API调用超时、密钥错误、请求频率限制等异常，返回标准化错误信息。

- 结果格式化模块：编码结果处理逻辑，将Gemini返回的JSON格式，转换为前端可展示、数据库可存储的结构化数据（核心要点、分析报告）。

编码示例（Python）：封装gemini_api.py，包含get_ai_analysis(content)方法，接收资料内容，调用Gemini API，返回格式化分析结果。

（6）服务器部署层（编码重点：配置脚本、部署自动化）

编码职责：编写服务器配置脚本、部署脚本，实现服务自动化部署，核心编码模块如下：

- 环境配置脚本：编写Shell脚本，自动安装依赖（Java、MySQL、Nginx、Python），配置环境变量。

- 部署脚本：编写Shell脚本，实现前端打包、后端打包、爬虫部署、服务启停，支持自动化部署。

- 容器化配置（可选）：编写Dockerfile、docker-compose.yml，实现前端、后端、爬虫、数据库的容器化部署。

- Nginx配置：编写nginx.conf，配置反向代理、静态资源缓存、跨域支持。

2.1.2 架构交互编码流程（明确接口调用逻辑）

各层编码交互流程清晰，接口标准化，便于编码调试，具体流程如下（含编码关键节点）：

1. 前端编码：用户操作（如上传资料）→ 调用Axios封装的请求 → 携带Token发送至后端接口（编码关键：请求头携带Token、参数格式化）。

2. 后端编码：接收请求 → 拦截器校验Token → Controller层参数校验 → Service层处理业务逻辑（如调用AI接口） → Dao层操作数据 → 返回标准化响应（编码关键：异常捕获、事务管理）。

3. AI服务编码：后端Service调用AI工具类 → 工具类封装请求参数 → 调用Gemini API → 捕获异常 → 格式化结果 → 返回给后端Service（编码关键：请求签名、超时重试）。

4. 爬虫编码：定时任务触发 → 爬虫脚本爬取数据 → 数据清洗 → 调用入库工具类 → 数据存储至MySQL（编码关键：去重逻辑、异常重试）。

5. 前端编码：接收后端响应 → 渲染页面组件 → 实现动画效果 → 展示结果（编码关键：响应数据解析、组件状态更新）。

2.2 页面编码规划（组件化视角）

页面编码遵循“组件复用、逻辑分离”原则，明确各页面的组件结构、接口调用逻辑，重点编码核心业务组件，具体规划如下：

2.2.1 一级页面（首页）编码重点

核心编码组件：

- 导航组件（Navbar）：编码导航菜单、跳转逻辑，绑定二级页面路由，支持高亮当前页面。

- 资料上传组件（FileUpload）：编码文件选择、上传进度、格式校验、接口调用逻辑，支持选择上传模块。

- 热点推荐组件（HotNews）：编码接口调用（获取最新3-5条热点）、列表渲染、跳转详情页逻辑。

- 动画背景组件（AnimateBackground）：编码CSS3动画/Three.js 3D背景，实现科幻效果，不阻塞页面加载。

编码要求：页面加载采用懒加载，优先渲染核心组件，动画效果采用requestAnimationFrame优化，避免卡顿。

2.2.2 二级页面编码重点（9个，统一编码规范）

每个二级页面统一编码结构：页面组件（Page）→ 业务组件（BusinessComponent）→ 原子组件（AtomicComponent），核心编码重点如下（以AI热点新闻为例）：

- 页面组件（AiNewsPage）：编码页面布局、路由接收参数、接口调用（获取50条热点）、筛选逻辑（时间/热度/领域）。

- 业务组件（NewsList）：编码新闻列表渲染、分页逻辑、点击跳转详情页，接收父组件传递的新闻数据。

- 业务组件（NewsFilter）：编码筛选条件渲染、筛选事件触发，将筛选参数传递给父组件，触发接口重新请求。

- 原子组件（NewsItem）：编码单条新闻卡片，包含标题、摘要、发布时间，复用至列表组件。

其他二级页面编码遵循此结构，重点编码各模块的核心业务组件（如AI Agent的资源列表组件、学习资料的下载组件），确保组件复用。

2.2.3 三级页面编码重点

核心编码重点：详情页（数据渲染、相关推荐）、分类页（筛选逻辑）、搜索页（搜索接口调用、结果渲染），编码要求如下：

- 详情页：编码接口调用（获取单条数据）、富文本渲染（新闻/资料详情）、相关数据推荐（接口调用）、返回按钮逻辑。

- 分类页：编码分类筛选逻辑、分类列表渲染，与二级页面筛选组件复用逻辑。

- 搜索页：编码搜索输入框、搜索按钮事件、搜索接口调用、搜索结果渲染（复用列表组件）。

2.3 技术选型与编码规范（核心，AI Coding 重点）

明确各技术栈的具体版本、编码规范、核心依赖，提供可直接参考的编码示例，确保编码一致性、可复用性。

2.3.1 前端技术选型与编码规范

技术类别

具体技术（版本）

编码规范与核心用法

编码示例（关键片段）

框架

Vue3.3+、TypeScript5.1+

使用Composition API（setup语法糖），强类型约束，组件Props定义类型，避免any类型；组件命名采用PascalCase，文件命名与组件名一致。

<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps<{
  title: string;
  list: Array<{id: number; content: string}>;
}>();
const activeId = ref(0);
</script>

构建工具

Vite4.4+

配置vite.config.ts，设置基地址、跨域代理、别名（@指向src）；打包优化（压缩、tree-shaking）。

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } } }
});

请求封装

Axios1.6+

封装request.ts，统一配置请求头、超时时间，实现请求/响应拦截，标准化响应处理。

import axios from 'axios';
const request = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL, timeout: 5000 });
// 请求拦截
request.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  return config;
});
// 响应拦截
request.interceptors.response.use(res => res.data, err => Promise.reject(err));
export default request;

其他核心技术

Pinia、Vue Router、Element Plus

Pinia：模块化管理状态，命名规范（useXxxStore）；Vue Router：路由懒加载、路由守卫；Element Plus：按需引入，自定义主题适配科幻风格。

// Pinia示例
import { defineStore } from 'pinia';
export const useNewsStore = defineStore('news', {
  state: () => ({ list: [], loading: false }),
  actions: { async getNewsList() { this.loading = true; this.list = await request.get('/api/v1/news'); this.loading = false; } }
});

2.3.2 后端技术选型与编码规范

技术类别

具体技术（版本）

编码规范与核心用法

编码示例（关键片段）

框架

SpringBoot3.2+、Java17+

包结构清晰，类命名规范（Controller后缀、Service后缀），方法命名采用驼峰式；使用Lombok简化代码（@Data、@Service、@Controller）。

@RestController
@RequestMapping("/api/v1/news")
@RequiredArgsConstructor
public class AiNewsController {
    private final AiNewsService aiNewsService;
    
    @GetMapping
    public Result<PageInfo<AiNewsDTO>> getNewsList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        PageInfo<AiNewsDTO> page = aiNewsService.getNewsList(pageNum, pageSize);
        return Result.success(page);
    }
}

数据访问

MyBatis-Plus3.5+、MySQL8.0+

实体类与数据库表一一对应，使用MyBatis-Plus注解配置；查询使用LambdaQueryWrapper，避免SQL硬编码；配置分页插件。

@Service
public class AiNewsServiceImpl implements AiNewsService {
    private final AiNewsMapper aiNewsMapper;
    
    @Override
    public PageInfo<AiNewsDTO> getNewsList(Integer pageNum, Integer pageSize) {
        Page&lt;AiNews&gt; page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<AiNews> queryWrapper = new LambdaQueryWrapper<>()
                .orderByDesc(AiNews::getPublishTime);
        Page<AiNews> resultPage = aiNewsMapper.selectPage(page, queryWrapper);
        return PageInfo.of(resultPage.convert(AiNewsDTO::new));
    }
}

接口认证

JWT0.11+

封装JWT工具类，实现Token生成、校验；编写拦截器，拦截未授权请求；Token过期时间设置为24小时。

public class JwtUtils {
    private static final String SECRET = "ai-practice-secret";
    private static final long EXPIRATION = 24 * 60 * 60 * 1000;
    
    public static String generateToken(Long userId) {
        return Jwts.builder()
                .setSubject(userId.toString())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(SignatureAlgorithm.HS256, SECRET)
                .compact();
    }
}

2.3.3 爬虫技术选型与编码规范

技术类别

具体技术（版本）

编码规范与核心用法

编码示例（关键片段）

爬虫框架

Scrapy2.11+、Python3.9+

爬虫项目结构统一（spiders、items、pipelines、settings）；爬虫类继承Scrapy.Spider，命名规范（XxxSpider）；items定义爬取字段，pipelines实现数据清洗、入库。

import scrapy
from scrapy.item import Item, Field

class AiNewsItem(Item):
    title = Field()  # 新闻标题
    summary = Field()  # 新闻摘要
    publish_time = Field()  # 发布时间
    source = Field()  # 来源

class AiNewsSpider(scrapy.Spider):
    name = "ai_news_spider"
    start_urls = ["https://xxx.com/ai-news"]
    
    def parse(self, response):
        news_list = response.xpath("//div[@class='news-item']")
        for news in news_list:
            item = AiNewsItem()
            item["title"] = news.xpath(".//h3/text()").extract_first().strip()
            item["summary"] = news.xpath(".//p/text()").extract_first().strip()
            yield item

定时任务

APScheduler3.10+

编写定时任务脚本，配置每日爬取时间（如凌晨2点），使用BlockingScheduler调度；异常捕获，确保任务失败可重试。

from apscheduler.schedulers.blocking import BlockingScheduler
from scrapy.cmdline import execute

def run_spider():
    execute(["scrapy", "crawl", "ai_news_spider"])

if __name__ == "__main__":
    scheduler = BlockingScheduler()
    # 每日凌晨2点执行
    scheduler.add_job(run_spider, "cron", hour=2)
    scheduler.start()

数据入库

PyMySQL1.1+

封装数据库工具类，实现连接池、批量入库；数据去重逻辑（根据标题+来源判断）；异常捕获，确保入库失败可重试。

import pymysql
from pymysql import cursors

class MysqlUtils:
    def __init__(self):
        self.conn = pymysql.connect(host="localhost", user="root", password="123456", db="ai_practice", cursorclass=cursors.DictCursor)
    
    def batch_insert(self, items):
        with self.conn.cursor() as cursor:
            sql = "INSERT INTO ai_news (title, summary, publish_time, source) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE summary=VALUES(summary)"
            cursor.executemany(sql, [(item["title"], item["summary"], item["publish_time"], item["source"]) for item in items])
        self.conn.commit()

2.3.4 AI服务编码（Gemini API集成）

技术类别

具体技术

编码规范与核心用法

编码示例（关键片段）

API调用

Python requests/Java OkHttp

封装AI调用工具类，API密钥加密存储（配置文件）；请求参数标准化，响应结果格式化；添加超时重试、异常捕获。

import requests
import json

class GeminiApiUtils:
    def __init__(self):
        self.api_key = "your-gemini-api-key"  # 实际编码需从加密配置文件读取
        self.api_url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
    
    def get_ai_analysis(self, content):
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        data = {
            "contents": [{"parts": [{"text": f"分析以下内容，提炼核心要点，生成简洁报告：{content}"}]}]
        }
        try:
            response = requests.post(self.api_url, headers=headers, data=json.dumps(data), timeout=60)
            response.raise_for_status()
            result = response.json()
            return result["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"Gemini API调用失败：{str(e)}")
            raise Exception("AI分析失败，请重试")

2.3.5 部署编码规范

核心部署脚本编码（Shell/Docker），实现自动化部署，示例如下：

- 后端部署脚本（deploy-backend.sh）：

- #!/bin/bash
# 停止现有服务
ps -ef | grep ai-practice-backend | grep -v grep | awk '{print $2}' | xargs kill -9
# 打包项目
cd /root/ai-practice-backend
mvn clean package -Dmaven.test.skip=true
# 启动服务
nohup java -jar target/ai-practice-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod > backend.log 2>&1 &
echo "后端服务启动成功"

- Docker Compose配置（docker-compose.yml）：

- version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - mysql
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: ai_practice
    ports:
      - "3306:3306"
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

