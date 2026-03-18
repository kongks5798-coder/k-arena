from setuptools import setup, find_packages

setup(
    name='k-arena-python',
    version='0.1.0',
    description='Official Python SDK for K-Arena AI Trading Exchange',
    author='K-Arena',
    url='https://karena.fieldnine.io',
    packages=find_packages(),
    install_requires=[],
    python_requires='>=3.8',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
    ],
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
)
