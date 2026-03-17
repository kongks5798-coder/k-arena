from setuptools import setup, find_packages

setup(
    name="k-arena",
    version="1.0.0",
    description="Python SDK for K-Arena AI Financial Exchange",
    long_description=open("README.md").read() if __import__("os").path.exists("README.md") else "",
    long_description_content_type="text/markdown",
    author="K-Arena",
    url="https://karena.fieldnine.io",
    project_urls={
        "Documentation": "https://karena.fieldnine.io/api-docs",
        "MCP Server": "https://karena.fieldnine.io/mcp",
        "Source": "https://github.com/kongks5798-coder/k-arena",
    },
    packages=find_packages(),
    python_requires=">=3.8",
    extras_require={
        "langchain": ["langchain>=0.1.0", "pydantic>=2.0.0"],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Office/Business :: Financial",
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
    ],
    keywords="AI agent financial exchange forex crypto langchain mcp",
)
