#!/usr/bin/env python3
import pathlib, json
base=pathlib.Path(__file__).resolve().parents[1]; objects={}; n=0
def add(isa,**kw):
 global n
 n+=1; key=f'{n:024X}'; objects[key]={'isa':isa,**kw}; return key
def ref(path,kind): return add('PBXFileReference',lastKnownFileType=kind,path=path,sourceTree='<group>')
def build(ref):return add('PBXBuildFile',fileRef=ref)
def configs(settings):
 return add('XCConfigurationList',buildConfigurations=[add('XCBuildConfiguration',name=name,buildSettings={**settings,**({'SWIFT_ACTIVE_COMPILATION_CONDITIONS':'DEBUG','SWIFT_OPTIMIZATION_LEVEL':'-Onone'} if name=='Debug' else {})}) for name in ['Debug','Release']],defaultConfigurationIsVisible=0,defaultConfigurationName='Release')
appFiles=[ref('Heritage/HeritageApp.swift','sourcecode.swift'),ref('Heritage/LocalServer.swift','sourcecode.swift')]
assets=ref('Heritage/Assets.xcassets','folder.assetcatalog'); web=ref('Heritage/Resources/Web','folder'); test=ref('HeritageUITests/GameplayTests.swift','sourcecode.swift')
product=add('PBXFileReference',explicitFileType='wrapper.application',path='Heritage.app',sourceTree='BUILT_PRODUCTS_DIR')
testProduct=add('PBXFileReference',explicitFileType='wrapper.cfbundle',path='HeritageUITests.xctest',sourceTree='BUILT_PRODUCTS_DIR')
products=add('PBXGroup',children=[product,testProduct],name='Products',sourceTree='<group>')
group=add('PBXGroup',children=appFiles+[web,assets,test,products],sourceTree='<group>')
common={'SDKROOT':'iphoneos','IPHONEOS_DEPLOYMENT_TARGET':'17.0','SWIFT_VERSION':'5.0','TARGETED_DEVICE_FAMILY':'1,2','CODE_SIGN_STYLE':'Automatic','PRODUCT_NAME':'$(TARGET_NAME)','CLANG_ENABLE_MODULES':'YES'}
app=add('PBXNativeTarget',name='Heritage',productName='Heritage',productReference=product,productType='com.apple.product-type.application',buildConfigurationList=configs({**common,'PRODUCT_BUNDLE_IDENTIFIER':'com.selment.heritagetravel','INFOPLIST_FILE':'Heritage/Info.plist','ASSETCATALOG_COMPILER_APPICON_NAME':'AppIcon'}),buildPhases=[add('PBXSourcesBuildPhase',buildActionMask=2147483647,files=[build(f) for f in appFiles],runOnlyForDeploymentPostprocessing=0),add('PBXResourcesBuildPhase',buildActionMask=2147483647,files=[build(web),build(assets)],runOnlyForDeploymentPostprocessing=0)],buildRules=[],dependencies=[])
dep=add('PBXTargetDependency',target=app)
tests=add('PBXNativeTarget',name='HeritageUITests',productName='HeritageUITests',productReference=testProduct,productType='com.apple.product-type.bundle.ui-testing',buildConfigurationList=configs({**common,'PRODUCT_BUNDLE_IDENTIFIER':'com.selment.heritagetravel.uitests','GENERATE_INFOPLIST_FILE':'YES','TEST_TARGET_NAME':'Heritage'}),buildPhases=[add('PBXSourcesBuildPhase',buildActionMask=2147483647,files=[build(test)],runOnlyForDeploymentPostprocessing=0)],buildRules=[],dependencies=[dep])
project=add('PBXProject',attributes={'LastUpgradeCheck':'2620'},buildConfigurationList=configs({}),compatibilityVersion='Xcode 14.0',developmentRegion='ja',knownRegions=['ja','en','Base'],mainGroup=group,productRefGroup=products,projectDirPath='',projectRoot='',targets=[app,tests])
def encode(x):
 if isinstance(x,dict):return '{'+''.join(encode(k)+' = '+encode(v)+';\n' for k,v in x.items())+'}'
 if isinstance(x,list):return '('+','.join(encode(v) for v in x)+')'
 if isinstance(x,int):return str(x)
 return json.dumps(x,ensure_ascii=False)
out=base/'Heritage.xcodeproj';out.mkdir(exist_ok=True)
(out/'project.pbxproj').write_text('// !$*UTF8*$!\n'+encode({'archiveVersion':1,'classes':{},'objectVersion':56,'objects':objects,'rootObject':project}))
scheme=out/'xcshareddata/xcschemes';scheme.mkdir(parents=True,exist_ok=True)
def br(ident,name):return f'<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{ident}" BuildableName="{name}" BlueprintName="{name.split(".")[0]}" ReferencedContainer="container:Heritage.xcodeproj"/>'
(scheme/'Heritage.xcscheme').write_text(f'''<?xml version="1.0" encoding="UTF-8"?><Scheme LastUpgradeVersion="2620" version="1.3"><BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">{br(app,'Heritage.app')}</BuildActionEntry></BuildActionEntries></BuildAction><TestAction buildConfiguration="Debug" shouldUseLaunchSchemeArgsEnv="YES"><Testables><TestableReference skipped="NO">{br(tests,'HeritageUITests.xctest')}</TestableReference></Testables></TestAction><LaunchAction buildConfiguration="Debug" useCustomWorkingDirectory="NO" launchStyle="0"><BuildableProductRunnable runnableDebuggingMode="0">{br(app,'Heritage.app')}</BuildableProductRunnable></LaunchAction><ProfileAction buildConfiguration="Release"><BuildableProductRunnable runnableDebuggingMode="0">{br(app,'Heritage.app')}</BuildableProductRunnable></ProfileAction><AnalyzeAction buildConfiguration="Debug"/><ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/></Scheme>''')
